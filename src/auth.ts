import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from "./config/db";
import { env } from "./config/env";

export const auth = betterAuth({
  baseURL: env.authUrl,
  secret: env.authSecret,
  database: mongodbAdapter(db),
  trustedOrigins: env.clientUrls,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    // Store BetterAuth users in the "users" collection required by the project spec.
    modelName: "users",
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "student", input: true },
      plan: { type: "string", required: false, defaultValue: "free", input: false },
      phone: { type: "string", required: false, input: true },
      bio: { type: "string", required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Never trust the role sent from the browser: only student / tutor can self-register.
        before: async (user) => {
          const requested = (user as { role?: string }).role;
          return {
            data: {
              ...user,
              role: requested === "tutor" ? "tutor" : "student",
              plan: "free",
            },
          };
        },
      },
    },
  },
  advanced: {
    useSecureCookies: env.isProd,
  },
});