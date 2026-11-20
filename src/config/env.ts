import "dotenv/config";

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT || 5000),
  isProd: process.env.NODE_ENV === "production",
  clientUrls: (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),
  mongoUri: required("MONGODB_URI"),
  dbName: process.env.DB_NAME || "mentorlagbe",
  authSecret: required("BETTER_AUTH_SECRET"),
  authUrl: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  jwtSecret: required("JWT_SECRET"),
  imgbbKey: process.env.IMGBB_API_KEY || "",
  stripeSecret: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};
