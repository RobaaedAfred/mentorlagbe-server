import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { env } from "./config/env";
import { HttpError } from "./utils/helpers";
import tokenRoutes from "./routes/token.routes";
import tuitionRoutes from "./routes/tuitions.routes";
import tutorRoutes from "./routes/tutor.routes";
import studentRoutes from "./routes/student.routes";
import adminRoutes from "./routes/admin.routes";
import meRoutes from "./routes/me.routes";
import statsRoutes from "./routes/stats.routes";
import paymentRoutes, { webhookHandler } from "./routes/payments.routes";

const app = express();

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin.replace(/\/$/, ""))),
    credentials: true,
  }),
);

// Stripe needs the raw body to verify signatures, so this is registered before express.json().
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), webhookHandler);

// BetterAuth handler must also be mounted before express.json().
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "MentorLagbe API", status: "ok", time: new Date().toISOString() });
});

app.use("/api/token", tokenRoutes);
app.use("/api/tuitions", tuitionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", meRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
};
app.use(errorHandler);

export default app;
