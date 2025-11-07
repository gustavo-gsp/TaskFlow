import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes";
import { logger } from "./utils/logger";

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Middleware de log de requisições
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }, 'Requisição recebida');
  next();
});

app.get("/health", (_, res) => res.json({ ok: true }));

// Rotas de autenticação
app.use("/auth", authRouter);

export default app;