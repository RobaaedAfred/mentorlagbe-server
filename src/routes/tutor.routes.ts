import { Router } from "express";
import { Applications, Tuitions } from "../config/db";
import { verifyTutor, verifyToken } from "../middleware/auth";
import { ah, num, str, toObjectId } from "../utils/helpers";
import type { TuitionDoc } from "../types";

const router = Router();
router.use(verifyToken, verifyTutor);

export const FREE_TUITION_LIMIT = 2;

const parseTuition = (body: Record<string, unknown>) => {
  const data = {
    title: str(body.title),
    subject: str(body.subject),
    classLevel: str(body.classLevel),
    mode: str(body.mode) as "Online" | "Offline",
    location: str(body.location),
    monthlyFee: num(body.monthlyFee),
    daysPerWeek: num(body.daysPerWeek),
    bannerImage: str(body.bannerImage),
    description: str(body.description),
  };
  if (data.title.length < 5) return { error: "Title must be at least 5 characters" };
  if (!data.subject) return { error: "Subject is required" };
  if (!data.classLevel) return { error: "Class level is required" };
  if (data.mode !== "Online" && data.mode !== "Offline") return { error: "Mode must be Online or Offline" };
  if (!data.location) return { error: "Location is required" };
  if (!(data.monthlyFee > 0)) return { error: "Monthly fee must be greater than 0" };
  if (!(data.daysPerWeek >= 1 && data.daysPerWeek <= 7)) return { error: "Days per week must be between 1 and 7" };
  if (!data.bannerImage) return { error: "Banner image is required" };
  return { data };
};

router.get(
  "/stats",
  ah(async (req, res) => {
    const email = req.user!.email;
    const [total, activeApproved, applicants] = await Promise.all([
      Tuitions.countDocuments({ tutorEmail: email }),
      Tuitions.countDocuments({ tutorEmail: email, approvalStatus: "approved", isActive: true }),
      Applications.countDocuments({ tutorEmail: email }),
    ]);
    res.json({ total, activeApproved, applicants, plan: req.user!.plan, limit: req.user!.plan === "pro" ? null : FREE_TUITION_LIMIT });
  }),
);

router.get(
  "/tuitions",
  ah(async (req, res) => {
    const items = await Tuitions.find({ tutorEmail: req.user!.email }).sort({ createdAt: -1 }).toArray();
    res.json(items);
  }),
);

router.post(
  "/tuitions",
  ah(async (req, res) => {
    const user = req.user!;
    if (user.plan !== "pro") {
      const count = await Tuitions.countDocuments({ tutorEmail: user.email });
      if (count >= FREE_TUITION_LIMIT) {
        return res.status(403).json({
          code: "PLAN_LIMIT",
          message: `Free plan tutors can post up to ${FREE_TUITION_LIMIT} tuitions. Upgrade to Pro for unlimited posts.`,
        });
      }
    }
    const parsed = parseTuition(req.body ?? {});
    if ("error" in parsed) return res.status(400).json({ message: parsed.error });

    const doc: Omit<TuitionDoc, "_id"> = {
      ...parsed.data!,
      tutorName: user.name,
      tutorEmail: user.email,
      approvalStatus: "pending",
      isActive: true,
      createdAt: new Date(),
    };
    const result = await Tuitions.insertOne(doc as TuitionDoc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  }),
);

router.get(
  "/tuitions/:id",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ message: "Tuition not found" });
    const tuition = await Tuitions.findOne({ _id, tutorEmail: req.user!.email });
    if (!tuition) return res.status(404).json({ message: "Tuition not found" });
    res.json(tuition);
  }),
);

router.put(
  "/tuitions/:id",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ message: "Tuition not found" });
    const parsed = parseTuition(req.body ?? {});
    if ("error" in parsed) return res.status(400).json({ message: parsed.error });

    const existing = await Tuitions.findOne({ _id, tutorEmail: req.user!.email });
    if (!existing) return res.status(404).json({ message: "Tuition not found" });

    // A rejected post goes back to the moderation queue once the tutor fixes it.
    const approvalStatus = existing.approvalStatus === "rejected" ? "pending" : existing.approvalStatus;
    await Tuitions.updateOne({ _id }, { $set: { ...parsed.data, approvalStatus } });
    res.json({ message: "Tuition updated", approvalStatus });
  }),
);

router.patch(
  "/tuitions/:id/toggle",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ message: "Tuition not found" });
    const existing = await Tuitions.findOne({ _id, tutorEmail: req.user!.email });
    if (!existing) return res.status(404).json({ message: "Tuition not found" });
    await Tuitions.updateOne({ _id }, { $set: { isActive: !existing.isActive } });
    res.json({ isActive: !existing.isActive });
  }),
);

router.delete(
  "/tuitions/:id",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ message: "Tuition not found" });
    const result = await Tuitions.deleteOne({ _id, tutorEmail: req.user!.email });
    if (!result.deletedCount) return res.status(404).json({ message: "Tuition not found" });
    await Applications.deleteMany({ tuitionId: String(_id) });
    res.json({ message: "Tuition deleted" });
  }),
);

/* ---------- Applicants ---------- */

router.get(
  "/applicants",
  ah(async (req, res) => {
    const items = await Applications.find({ tutorEmail: req.user!.email }).sort({ appliedAt: -1 }).toArray();
    res.json(items);
  }),
);

router.patch(
  "/applications/:id/status",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    const status = str(req.body?.status);
    if (!_id) return res.status(404).json({ message: "Application not found" });
    if (status !== "accepted" && status !== "rejected") {
      return res.status(400).json({ message: "Status must be accepted or rejected" });
    }
    const result = await Applications.updateOne({ _id, tutorEmail: req.user!.email }, { $set: { status } });
    if (!result.matchedCount) return res.status(404).json({ message: "Application not found" });
    res.json({ message: `Application ${status}`, status });
  }),
);

export default router;
