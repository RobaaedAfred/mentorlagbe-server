import { Router } from "express";
import { Applications, Tuitions, Users } from "../config/db";
import { verifyStudent, verifyToken } from "../middleware/auth";
import { ah, str, toObjectId } from "../utils/helpers";
import type { ApplicationDoc } from "../types";

const router = Router();
router.use(verifyToken, verifyStudent);

router.get(
  "/stats",
  ah(async (req, res) => {
    const email = req.user!.email;
    const [total, accepted, pending, user] = await Promise.all([
      Applications.countDocuments({ studentEmail: email }),
      Applications.countDocuments({ studentEmail: email, status: "accepted" }),
      Applications.countDocuments({ studentEmail: email, status: "pending" }),
      Users.findOne({ email }, { projection: { bookmarks: 1 } }),
    ]);
    res.json({ total, accepted, pending, saved: user?.bookmarks?.length ?? 0, plan: req.user!.plan });
  }),
);

/* ---------- Applications ---------- */

router.post(
  "/applications",
  ah(async (req, res) => {
    const user = req.user!;
    const tuitionId = str(req.body?.tuitionId);
    const studentPhone = str(req.body?.studentPhone);
    const preferredSchedule = str(req.body?.preferredSchedule);
    const studentNote = str(req.body?.studentNote);

    const _id = toObjectId(tuitionId);
    if (!_id) return res.status(400).json({ message: "Invalid tuition" });
    if (!/^[+\d][\d\s-]{6,17}$/.test(studentPhone)) return res.status(400).json({ message: "Enter a valid phone number" });
    if (preferredSchedule.length < 3) return res.status(400).json({ message: "Preferred schedule is required" });
    if (studentNote.length < 10) return res.status(400).json({ message: "Learning note must be at least 10 characters" });

    const tuition = await Tuitions.findOne({ _id, approvalStatus: "approved", isActive: true });
    if (!tuition) return res.status(404).json({ message: "This tuition is not available for applications" });

    const duplicate = await Applications.findOne({ tuitionId, studentEmail: user.email });
    if (duplicate) return res.status(409).json({ message: "You have already applied for this tuition" });

    const doc: Omit<ApplicationDoc, "_id"> = {
      tuitionId,
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      monthlyFee: tuition.monthlyFee,
      tutorEmail: tuition.tutorEmail,
      tutorName: tuition.tutorName,
      studentName: user.name,
      studentEmail: user.email,
      studentPhone,
      preferredSchedule,
      studentNote,
      status: "pending",
      appliedAt: new Date(),
    };
    const result = await Applications.insertOne(doc as ApplicationDoc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  }),
);

/** Lets the UI know whether the student has applied already (to disable the button). */
router.get(
  "/applications/check/:tuitionId",
  ah(async (req, res) => {
    const found = await Applications.findOne({ tuitionId: req.params.tuitionId, studentEmail: req.user!.email });
    res.json({ applied: !!found, status: found?.status ?? null });
  }),
);

router.get(
  "/applications",
  ah(async (req, res) => {
    const items = await Applications.find({ studentEmail: req.user!.email }).sort({ appliedAt: -1 }).toArray();
    res.json(items);
  }),
);

router.delete(
  "/applications/:id",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ message: "Application not found" });
    const result = await Applications.deleteOne({ _id, studentEmail: req.user!.email, status: "pending" });
    if (!result.deletedCount) {
      return res.status(400).json({ message: "Only pending applications can be cancelled" });
    }
    res.json({ message: "Application cancelled" });
  }),
);

/* ---------- Bookmarks (saved tuitions) ---------- */

router.get(
  "/bookmarks",
  ah(async (req, res) => {
    const user = await Users.findOne({ email: req.user!.email }, { projection: { bookmarks: 1 } });
    const ids = (user?.bookmarks ?? []).map(toObjectId).filter((v): v is NonNullable<typeof v> => !!v);
    const items = ids.length ? await Tuitions.find({ _id: { $in: ids }, approvalStatus: "approved" }).toArray() : [];
    res.json(items);
  }),
);

router.post(
  "/bookmarks/:tuitionId",
  ah(async (req, res) => {
    if (!toObjectId(req.params.tuitionId)) return res.status(400).json({ message: "Invalid tuition" });
    await Users.updateOne({ email: req.user!.email }, { $addToSet: { bookmarks: req.params.tuitionId } });
    res.json({ saved: true });
  }),
);

router.delete(
  "/bookmarks/:tuitionId",
  ah(async (req, res) => {
    await Users.updateOne({ email: req.user!.email }, { $pull: { bookmarks: req.params.tuitionId } });
    res.json({ saved: false });
  }),
);

export default router;
