import app from "./app";
import { env } from "./config/env";

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`MentorLagbe API running on http://localhost:${env.port}`);
  });
}

export default app;
