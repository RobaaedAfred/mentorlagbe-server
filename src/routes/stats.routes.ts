import { Router } from "express";
import { Tuitions, Users } from "../config/db.js";
import { ah } from "../utils/helpers.js";

const router = Router();

router.get(
  "/",
  ah(async (_req, res) => {
    const [tutors, students, tuitions, subjects] = await Promise.all([
      Users.countDocuments({ role: "tutor" }),
      Users.countDocuments({ role: "student" }),
      Tuitions.countDocuments({ approvalStatus: "approved", isActive: true }),
      Tuitions.distinct("subject", { approvalStatus: "approved", isActive: true }),
    ]);
    res.json({ tutors, students, tuitions, subjects: subjects.length });
  }),
);

export default router;
