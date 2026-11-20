import app from "./app.js";
import { env } from "./config/env.js";

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`MentorLagbe API running on http://localhost:${env.port}`);
  });
}

export default app;
