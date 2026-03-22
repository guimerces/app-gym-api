// src/routes/treinoRoutes.ts
import { Router } from "express";
import { TreinoController } from "../controllers/TreinoController";
import { FirebaseTreinoRepository } from "../repositories/FirebaseTreinoRepository";

const router = Router();

// 1. Instanciamos o Banco de Dados (Chamando o Singleton!)
const treinoRepository = FirebaseTreinoRepository.getInstance();

// 2. Injetamos o Banco de Dados dentro do Controller
const treinoController = new TreinoController(treinoRepository);

// 3. Criamos o "Endereço" (Endpoint) que o celular/Postman vai chamar.
// O ":usuarioId" é um parâmetro dinâmico. O Express vai pegar isso e jogar no req.params
router.get("/treinos/:usuarioId/proximo", async (req, res) => {
  try {
    // 1. A Rota pede pro Controller calcular e ESPERA (await) a resposta
    const resultado = await treinoController.sugerirProximoTreino(req, res);

    // 2. A Rota pega o resultado e FINALMENTE manda pro Postman!
    res.json(resultado);
  } catch (error) {
    // 3. Se algo explodir no Controller, a Rota avisa o Postman para não carregar infinito
    console.error("Erro ao sugerir treino:", error);
    res.status(500).json({ erro: "Deu ruim no servidor." });
  }
});

// Rota secreta para popular o banco de dados
router.post("/treinos/seed", async (req, res) => {
  await treinoRepository.popularBancoDeTeste();
  res.json({ mensagem: "Banco de dados populado com sucesso!" });
});

export { router as treinoRoutes };
