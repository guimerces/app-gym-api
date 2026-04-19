// src/server.ts (ou app.ts)
import express from "express";
import { treinoRoutes } from "./routes/treinoRoutes";
import cors from "cors";

const app = express();
app.use(cors()); // 2. Libere a catraca ANTES das rotas
app.use(express.json()); // Para o Express entender JSON

// Avisamos ao Express para usar as nossas rotas de treino
app.use(treinoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor voando na porta ${PORT}`);
});
