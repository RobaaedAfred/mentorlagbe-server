import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { env } from "./config/env.js";
import { HttpError } from "./utils/helpers.js";
import tokenRoutes from "./routes/token.routes.js";
import tuitionRoutes from "./routes/tuitions.routes.js";
import tutorRoutes from "./routes/tutor.routes.js";
import studentRoutes from "./routes/student.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import meRoutes from "./routes/me.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import paymentRoutes, { webhookHandler } from "./routes/payments.routes.js";

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
