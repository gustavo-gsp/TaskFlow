import { Worker } from "bullmq";
const worker = new Worker("reminders", async job => {
  console.log("Enviando lembrete:", job.data);
}, { connection: { host: "localhost", port: 6379 } });

console.log("👷 Worker de lembretes iniciado");