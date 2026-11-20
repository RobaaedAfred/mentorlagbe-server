import { MongoClient } from "mongodb";
import { env } from "./env";
import type { ApplicationDoc, PaymentDoc, TuitionDoc, UserDoc } from "../types";

export const client = new MongoClient(env.mongoUri);
export const db = client.db(env.dbName);

export const Users = db.collection<UserDoc>("users");
export const Tuitions = db.collection<TuitionDoc>("tuitions");
export const Applications = db.collection<ApplicationDoc>("applications");
export const Payments = db.collection<PaymentDoc>("payments");
