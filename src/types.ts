import { ObjectId } from "mongodb";

export type Role = "student" | "tutor" | "admin";
export type Plan = "free" | "pro";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  phone?: string;
  bio?: string;
  plan: Plan;
  bookmarks?: string[];
  createdAt: Date;
}

export interface TuitionDoc {
  _id: ObjectId;
  title: string;
  subject: string;
  classLevel: string;
  mode: "Online" | "Offline";
  location: string;
  monthlyFee: number;
  daysPerWeek: number;
  bannerImage: string;
  description: string;
  tutorName: string;
  tutorEmail: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  createdAt: Date;
}

export interface ApplicationDoc {
  _id: ObjectId;
  tuitionId: string;
  tuitionTitle: string;
  subject: string;
  monthlyFee: number;
  tutorEmail: string;
  tutorName?: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  preferredSchedule: string;
  studentNote: string;
  status: ApplicationStatus;
  appliedAt: Date;
}

export interface PaymentDoc {
  _id: ObjectId;
  userEmail: string;
  userName: string;
  userRole: Role;
  planName: string;
  amount: number;
  currency: string;
  transactionId: string;
  stripeSessionId: string;
  paymentStatus: "paid";
  paidAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  plan: Plan;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
