// src/routes/treinoRoutes.ts
import { Router } from "express";
import { TreinoController } from "../controllers/TreinoController";
import { FirebaseTreinoRepository } from "../repositories/FirebaseTreinoRepository";
import { verifyToken } from "../middlewares/authMiddleware"; // <-- 1. Importamos o Segurança aqui!

const router = Router();

// Instanciamos o Banco e o Controller
const treinoRepository = FirebaseTreinoRepository.getInstance();
const treinoController = new TreinoController(treinoRepository);

// ==========================================
// A CATRACA DE SEGURANÇA (MIDDLEWARE GLOBAL DO ROUTER)
// ==========================================
// A partir desta linha, TODAS as rotas abaixo vão exigir o Crachá (Token).
// Se o Front-End não mandar o Token, o código para aqui mesmo e devolve erro 401.
// router.use(verifyToken);

// ==========================================
// 1. O MOTOR DO COACH (Sugestão)
// ==========================================
router.get("/usuarios/:usuarioId/treinos/sugestao", async (req, res) => {
  try {
    await treinoController.sugerirProximoTreino(req, res);
  } catch (error) {
    console.error("Erro ao sugerir treino:", error);
    res.status(500).json({ erro: "Deu ruim no servidor." });
  }
});

// ==========================================
// 2. DOMÍNIO DE EXECUÇÕES (Histórico)
// ==========================================
router.post("/usuarios/:usuarioId/execucoes", (req, res) =>
  treinoController.salvarTreinoFeito(req, res),
);

router.put("/execucoes/:id", (req, res) =>
  treinoController.atualizarTreinoFeito(req, res),
);

// ==========================================
// 3. DOMÍNIO DE FICHAS (Templates)
// ==========================================
router.post("/fichas", (req, res) =>
  treinoController.criarFichaTemplate(req, res),
);

router.get("/usuarios/:usuarioId/fichas", (req, res) =>
  treinoController.listarFichasDoAluno(req, res),
);

router.delete("/fichas/:id", (req, res) =>
  treinoController.deletarFicha(req, res),
);

// ==========================================
// 4. ADMINISTRAÇÃO (Seed)
// ==========================================
router.post("/admin/seed", (req, res) =>
  treinoController.popularBanco(req, res),
);

export { router as treinoRoutes };
