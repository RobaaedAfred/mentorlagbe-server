import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import { env } from "./config/env";
import { HttpError } from "./utils/helpers";

const app = express();

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin.replace(/\/$/, ""))),
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "MentorLagbe API", status: "ok", time: new Date().toISOString() });
});

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