import { Router } from "express";
import type { Filter } from "mongodb";
import { Payments, Tuitions, Users } from "../config/db";
import { verifyAdmin, verifyToken } from "../middleware/auth";
import { ah, escapeRegex, str, toObjectId } from "../utils/helpers";
import type { TuitionDoc, UserDoc } from "../types";

const router = Router();
router.use(verifyToken, verifyAdmin);

router.get(
  "/stats",
  ah(async (_req, res) => {
    const [totalUsers, totalTutors, totalStudents, pending, approved, rejected, revenue] = await Promise.all([
      Users.countDocuments(),
      Users.countDocuments({ role: "tutor" }),
      Users.countDocuments({ role: "student" }),
      Tuitions.countDocuments({ approvalStatus: "pending" }),
      Tuitions.countDocuments({ approvalStatus: "approved" }),
      Tuitions.countDocuments({ approvalStatus: "rejected" }),
      Payments.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
    ]);
    res.json({
      totalUsers,
      totalTutors,
      totalStudents,
      pending,
      approved,
      rejected,
      revenue: revenue[0]?.total ?? 0,
    });
  }),
);

/* ---------- Users ---------- */

router.get(
  "/users",
  ah(async (req, res) => {
    const filter: Filter<UserDoc> = {};
    const search = str(req.query.search);
    const role = str(req.query.role);
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }
    if (["student", "tutor", "admin"].includes(role)) filter.role = role as UserDoc["role"];
    const users = await Users.find(filter, { projection: { bookmarks: 0 } }).sort({ createdAt: -1 }).toArray();
    res.json(users);
  }),
);

router.patch(
  "/users/:id/role",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    const role = str(req.body?.role);
    if (!_id) return res.status(404).json({ message: "User not found" });
    if (!["student", "tutor", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (String(_id) === req.user!.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }
    const result = await Users.updateOne({ _id }, { $set: { role: role as UserDoc["role"] } });
    if (!result.matchedCount) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Role updated", role });
  }),
);

/* ---------- Tuition moderation ---------- */

router.get(
  "/tuitions",
  ah(async (req, res) => {
    const filter: Filter<TuitionDoc> = {};
    const status = str(req.query.status);
    if (["pending", "approved", "rejected"].includes(status)) filter.approvalStatus = status as TuitionDoc["approvalStatus"];
    const items = await Tuitions.find(filter).sort({ createdAt: -1 }).toArray();
    res.json(items);
  }),
);

router.patch(
  "/tuitions/:id/status",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    const status = str(req.body?.status);
    if (!_id) return res.status(404).json({ message: "Tuition not found" });
    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }
    const result = await Tuitions.updateOne({ _id }, { $set: { approvalStatus: status } });
    if (!result.matchedCount) return res.status(404).json({ message: "Tuition not found" });
    res.json({ message: `Tuition ${status}`, approvalStatus: status });
  }),
);

/* ---------- Transactions ---------- */

router.get(
  "/transactions",
  ah(async (_req, res) => {
    const items = await Payments.find().sort({ paidAt: -1 }).toArray();
    res.json(items);
  }),
);

export default router;