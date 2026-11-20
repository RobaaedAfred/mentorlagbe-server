import { Router } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { signToken } from "../middleware/auth.js";
import { Users } from "../config/db.js";
import { ah } from "../utils/helpers.js";

const router = Router();

router.get(
  "/",
  ah(async (req, res) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) return res.status(401).json({ message: "Not signed in" });

    const user = await Users.findOne({ email: session.user.email });
    if (!user) return res.status(401).json({ message: "User not found" });

    const token = signToken({ id: String(user._id), email: user.email, role: user.role });
    res.json({ token });
  }),
);

export default router;
