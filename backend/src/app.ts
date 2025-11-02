import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(4000, () => console.log("✅ Backend rodando na porta 4000"));