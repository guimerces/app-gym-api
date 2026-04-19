import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

// Criamos uma interface para o TypeScript saber que o Request agora pode carregar os dados do usuário
export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // 1. Pega o crachá do cabeçalho da requisição
  const authHeader = req.headers.authorization;

  // Se não tem crachá, barra na porta (Erro 401 - Não Autorizado)
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ erro: "Acesso negado. Crachá (Token) não fornecido." });
    return;
  }

  // O crachá vem escrito "Bearer eyJhbGciOi...", nós separamos só o código
  const token = authHeader.split("Bearer ")[1] as string;

  try {
    // 2. Pergunta ao Firebase se esse crachá é falso ou se já venceu
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 3. Se for verdadeiro, penduramos os dados do usuário na requisição e deixamos ele passar
    req.user = decodedToken;
    next(); // "Pode passar para a rota de treinos!"
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    res.status(401).json({ erro: "Crachá inválido ou expirado." });
  }
};
