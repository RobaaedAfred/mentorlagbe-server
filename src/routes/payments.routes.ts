import { Router } from "express";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { Payments, Users } from "../config/db";
import { env } from "../config/env";
import { verifyToken } from "../middleware/auth";
import { ah, HttpError } from "../utils/helpers";
import type { PaymentDoc, Role } from "../types";

const router = Router();

let stripeClient: Stripe | null = null;
const stripe = () => {
  if (!env.stripeSecret) throw new HttpError(500, "Stripe is not configured");
  return (stripeClient ??= new Stripe(env.stripeSecret));
};

export const PLANS: Partial<Record<Role, { name: string; amount: number; description: string }>> = {
  tutor: { name: "Pro Tutor", amount: 15, description: "Unlimited tuition posts and a verified badge" },
  student: { name: "Pro Student", amount: 10, description: "Priority booking with tutors" },
};


const fulfilSession = async (session: Stripe.Checkout.Session) => {
  if (session.payment_status !== "paid") return null;
  const meta = session.metadata ?? {};
  const userEmail = meta.userEmail;
  if (!userEmail) return null;

  const doc: Omit<PaymentDoc, "_id"> = {
    userEmail,
    userName: meta.userName ?? "",
    userRole: (meta.userRole as Role) ?? "student",
    planName: meta.planName ?? "Pro",
    amount: (session.amount_total ?? 0) / 100,
    currency: session.currency ?? "usd",
    transactionId: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
    stripeSessionId: session.id,
    paymentStatus: "paid",
    paidAt: new Date(),
  };

  await Payments.updateOne({ stripeSessionId: session.id }, { $setOnInsert: doc as PaymentDoc }, { upsert: true });
  await Users.updateOne({ email: userEmail }, { $set: { plan: "pro" } });
  return doc;
};

const pickClientUrl = (req: Request) => {
  const origin = req.headers.origin?.replace(/\/$/, "");
  return origin && env.clientUrls.includes(origin) ? origin : env.clientUrls[0];
};

router.post(
  "/checkout",
  verifyToken,
  ah(async (req, res) => {
    const user = req.user!;
    const plan = PLANS[user.role];
    if (!plan) return res.status(400).json({ message: "Admins do not need a subscription" });
    if (user.plan === "pro") return res.status(400).json({ message: "You are already on the Pro plan" });

    const clientUrl = pickClientUrl(req);
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.amount * 100,
            product_data: { name: `MentorLagbe ${plan.name} Plan`, description: plan.description },
          },
        },
      ],
      metadata: { userEmail: user.email, userName: user.name, userRole: user.role, planName: plan.name },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
    });
    res.json({ url: session.url });
  }),
);

/** Checkout verification used by /payment/success (works even if the webhook is delayed). */
router.get(
  "/verify",
  verifyToken,
  ah(async (req, res) => {
    const sessionId = String(req.query.session_id ?? "");
    if (!sessionId.startsWith("cs_")) return res.status(400).json({ message: "Invalid session" });

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userEmail !== req.user!.email) return res.status(403).json({ message: "This payment belongs to another account" });

    const payment = await fulfilSession(session);
    if (!payment) return res.status(402).json({ message: "Payment not completed" });
    res.json({ message: "Payment verified", planName: payment.planName, amount: payment.amount, transactionId: payment.transactionId });
  }),
);

/** Stripe webhook - mounted with a raw body parser in app.ts. */
export const webhookHandler = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || !env.stripeWebhookSecret) return res.status(400).send("Webhook not configured");
  try {
    const event = stripe().webhooks.constructEvent(req.body, signature, env.stripeWebhookSecret);
    if (event.type === "checkout.session.completed") {
      await fulfilSession(event.data.object as Stripe.Checkout.Session);
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
};

export default router;
