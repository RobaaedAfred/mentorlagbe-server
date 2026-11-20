import { MongoClient } from "mongodb";
import { env } from "./env";
import type { ApplicationDoc, PaymentDoc, TuitionDoc, UserDoc } from "../types";

// The driver connects lazily on the first operation, which keeps cold starts
// on serverless platforms simple and avoids a blocking connect() at import time.
export const client = new MongoClient(env.mongoUri);
export const db = client.db(env.dbName);

// The 4 application collections. ("users" is shared with BetterAuth.)
export const Users = db.collection<UserDoc>("users");
export const Tuitions = db.collection<TuitionDoc>("tuitions");
export const Applications = db.collection<ApplicationDoc>("applications");
export const Payments = db.collection<PaymentDoc>("payments");
