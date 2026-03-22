// src/routes/treinoRoutes.ts
import { Router } from "express";
import { TreinoController } from "../controllers/TreinoController";
import { FirebaseTreinoRepository } from "../repositories/FirebaseTreinoRepository";

const router = Router();

// 1. Instanciamos o Banco de Dados (Chamando o Singleton!)
const treinoRepository = FirebaseTreinoRepository.getInstance();

// 2. Injetamos o Banco de Dados dentro do Controller
const treinoController = new TreinoController(treinoRepository);

// ==========================================
// 1. O MOTOR DO COACH (Sugestão)
// ==========================================

// RESTful: Pede a "sugestao" de treino do recurso "usuario"
// Antigo: /treinos/:usuarioId/proximo
router.get("/usuarios/:usuarioId/treinos/sugestao", async (req, res) => {
  try {
    // 1. A Rota pede pro Controller calcular (O Controller já faz o res.json lá dentro!)
    await treinoController.sugerirProximoTreino(req, res);
  } catch (error) {
    // 2. Se algo explodir no Controller, a Rota avisa o Postman para não carregar infinito
    console.error("Erro ao sugerir treino:", error);
    res.status(500).json({ erro: "Deu ruim no servidor." });
  }
});


// ==========================================
// 2. DOMÍNIO DE EXECUÇÕES (Histórico)
// ==========================================

// RESTful: Cria uma "execucao" dentro do recurso "usuario"
// Antigo: /treinos/:usuarioId/executar
router.post("/usuarios/:usuarioId/execucoes", (req, res) =>
  treinoController.salvarTreinoFeito(req, res)
);

// RESTful: Atualiza uma execução específica (Acesso direto pelo ID)
// Antigo: /execucoes/:id (Já estava perfeito!)
router.put("/execucoes/:id", (req, res) =>
  treinoController.atualizarTreinoFeito(req, res)
);


// ==========================================
// 3. DOMÍNIO DE FICHAS (Templates)
// ==========================================

// RESTful: Cria uma nova Ficha
// Adicionei esta rota referente ao nosso passo anterior de criar Fichas!
router.post("/fichas", (req, res) =>
  treinoController.criarFichaTemplate(req, res)
);

// RESTful: Lista as "fichas" de um "usuario"
// Antigo: /fichas/usuario/:usuarioId
router.get("/usuarios/:usuarioId/fichas", (req, res) =>
  treinoController.listarFichasDoAluno(req, res)
);

// RESTful: Apaga uma ficha específica (Acesso direto pelo ID)
// Antigo: /fichas/:id (Já estava perfeito!)
router.delete("/fichas/:id", (req, res) =>
  treinoController.deletarFicha(req, res)
);


// ==========================================
// 4. ADMINISTRAÇÃO (Seed)
// ==========================================

// Rota secreta para popular o banco de dados
router.post("/admin/seed", (req, res) => 
  treinoController.popularBanco(req, res)
);

export { router as treinoRoutes };