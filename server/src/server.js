import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import initDb from "./db/init-db.js";
import authRoutes from "./routes/auth.route.js";
import notesRoutes from "./routes/notes.route.js";
import adminRoutes from "./routes/admin.route.js";
import publicRoutes from "./routes/public.route.js";
import catalogRoutes from './routes/catalog.route.js';

import teacherRoutes from './routes/teacher.route.js';
import studentRoutes from './routes/student.route.js';

import projectRoutes from './routes/project.route.js';

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/project', projectRoutes);

const port = Number(process.env.PORT || 3000);
(async () => {
  if (process.env.DB_INIT_ON_START !== "false") await initDb();
  app.listen(port, () => console.log(`[api] http://localhost:${port}`));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
