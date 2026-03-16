// src/server.ts (ou app.ts)
import express from "express";
import { treinoRoutes } from "./routes/treinoRoutes";

const app = express();
app.use(express.json()); // Para o Express entender JSON

// Avisamos ao Express para usar as nossas rotas de treino
app.use(treinoRoutes);

const PORTA = 3000;
app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});
