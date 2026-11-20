import { Router } from "express";
import { Users } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import { ah, str } from "../utils/helpers.js";
import { env } from "../config/env.js";

const router = Router();

router.get(
  "/me",
  verifyToken,
  ah(async (req, res) => {
    const user = await Users.findOne({ email: req.user!.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      role: user.role,
      plan: user.plan ?? "free",
      phone: user.phone ?? "",
      bio: user.bio ?? "",
      bookmarks: user.bookmarks ?? [],
      createdAt: user.createdAt,
    });
  }),
);

router.patch(
  "/me",
  verifyToken,
  ah(async (req, res) => {
    const name = str(req.body?.name);
    const phone = str(req.body?.phone);
    const bio = str(req.body?.bio);
    const image = str(req.body?.image);

    if (name.length < 2) return res.status(400).json({ message: "Name must be at least 2 characters" });
    if (phone && !/^[+\d][\d\s-]{6,17}$/.test(phone)) return res.status(400).json({ message: "Enter a valid phone number" });
    if (bio.length > 500) return res.status(400).json({ message: "Bio must be 500 characters or fewer" });
    if (image && !/^https?:\/\//i.test(image)) return res.status(400).json({ message: "Image must be a valid URL" });

    const $set: Record<string, string> = { name, phone, bio };
    if (image) $set.image = image;
    await Users.updateOne({ email: req.user!.email }, { $set });
    res.json({ message: "Profile updated" });
  }),
);


router.post(
  "/upload",
  verifyToken,
  ah(async (req, res) => {
    if (!env.imgbbKey) return res.status(500).json({ message: "Image upload is not configured" });
    const raw = str(req.body?.image).replace(/^data:image\/[a-zA-Z+.-]+;base64,/, "");
    if (!raw) return res.status(400).json({ message: "Image data is required" });
    if (raw.length > 9_000_000) return res.status(413).json({ message: "Image is too large (max ~6MB)" });

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${env.imgbbKey}`, {
      method: "POST",
      body: new URLSearchParams({ image: raw }),
    });
    const json = (await response.json()) as { success?: boolean; data?: { url?: string; display_url?: string } };
    if (!response.ok || !json.success) return res.status(502).json({ message: "ImgBB upload failed" });
    res.json({ url: json.data?.display_url ?? json.data?.url });
  }),
);

export default router;
