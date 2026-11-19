import { MongoClient } from "mongodb";
import { env } from "./env";


export const client = new MongoClient(env.mongoUri);
export const db = client.db(env.dbName);

export const Users = db.collection("users");
export const Tuitions = db.collection("tuitions");
export const Applications = db.collection("applications");
export const Payments = db.collection("payments");