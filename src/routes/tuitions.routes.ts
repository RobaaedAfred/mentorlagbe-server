import { Router } from "express";
import type { Filter, Sort } from "mongodb";
import { Tuitions, Users } from "../config/db";
import { ah, escapeRegex, toObjectId } from "../utils/helpers";
import type { TuitionDoc } from "../types";

const router = Router();

const publicFilter = (): Filter<TuitionDoc> => ({ approvalStatus: "approved", isActive: true });

/**
 * GET /api/tuitions
 * Server-side search (title / subject), filters (subject, classLevel, mode),
 * sorting and skip/limit pagination. Only approved + active posts are returned.
 */
router.get(
  "/",
  ah(async (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    const filter = publicFilter();

    const search = (q.search ?? "").trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ title: rx }, { subject: rx }];
    }
    if (q.subject) filter.subject = q.subject;
    if (q.classLevel) filter.classLevel = q.classLevel;
    if (q.mode === "Online" || q.mode === "Offline") filter.mode = q.mode;

    const page = Math.max(1, parseInt(q.page ?? "1", 10) || 1);
    const limit = Math.min(24, Math.max(1, parseInt(q.limit ?? "9", 10) || 9));

    const sortMap: Record<string, Sort> = {
      newest: { createdAt: -1 },
      "fee-asc": { monthlyFee: 1 },
      "fee-desc": { monthlyFee: -1 },
    };
    const sort = sortMap[q.sort ?? "newest"] ?? sortMap.newest;

    const [items, total] = await Promise.all([
      Tuitions.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      Tuitions.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  }),
);

/** GET /api/tuitions/featured - 6 latest approved + active tuitions for the home page */
router.get(
  "/featured",
  ah(async (_req, res) => {
    const items = await Tuitions.find(publicFilter()).sort({ createdAt: -1 }).limit(6).toArray();
    res.json(items);
  }),
);

/** GET /api/tuitions/meta - distinct values used by the filter dropdowns */
router.get(
  "/meta",
  ah(async (_req, res) => {
    const [subjects, classLevels] = await Promise.all([
      Tuitions.distinct("subject", publicFilter()),
      Tuitions.distinct("classLevel", publicFilter()),
    ]);
    res.json({ subjects: subjects.sort(), classLevels: classLevels.sort() });
  }),
);

/** GET /api/tuitions/:id - details page (approved posts only) with a tutor summary */
router.get(
  "/:id",
  ah(async (req, res) => {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ message: "Tuition not found" });

    const tuition = await Tuitions.findOne({ _id, approvalStatus: "approved" });
    if (!tuition) return res.status(404).json({ message: "Tuition not found" });

    const tutor = await Users.findOne(
      { email: tuition.tutorEmail },
      { projection: { name: 1, image: 1, bio: 1, plan: 1, createdAt: 1 } },
    );
    const otherCount = await Tuitions.countDocuments({ ...publicFilter(), tutorEmail: tuition.tutorEmail });

    res.json({
      ...tuition,
      tutor: tutor
        ? { name: tutor.name, image: tutor.image ?? null, bio: tutor.bio ?? "", verified: tutor.plan === "pro", joinedAt: tutor.createdAt, activeTuitions: otherCount }
        : null,
    });
  }),
);

export default router;
