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
router.get("/treinos/:usuarioId/proximo", (req, res) =>
  treinoController.sugerirProximoTreino(req, res),
);

export { router as treinoRoutes };
