import { Router } from "express";
export const authRouter = Router();

authRouter.post("/register", (req, res) => res.json({ ok: "registered" }));
authRouter.post("/login", (req, res) => res.json({ ok: "logged in" }));