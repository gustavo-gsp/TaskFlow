import app from "./app";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Backend rodando');
  console.log(`✅ Backend rodando na porta ${PORT}`);
});