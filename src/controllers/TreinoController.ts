// src/controllers/TreinoController.ts
import { Request, Response } from "express";
import { ITreinoRepository } from "../repositories/ITreinoRepository";

export class TreinoController {
  // Na instanciação do controller decidimos a classe que implementará a interface: injeção de dependência
  constructor(private treinoRepository: ITreinoRepository) {}

  // APLICAÇÃO DO PADRÃO CONTROLLER
  // Ele recebe a requisição (req) da internet, mas não suja a mão com regras complexas.
  async sugerirProximoTreino(req: Request, res: Response) {
    try {
      // Extraímos o ID do usuário (geralmente vem da URL ou do token de login)
      const usuarioId = (req.params.usuarioId as string) || "ID_TESTE";

      // O Controller DELEGA a busca de dados para o Repositório
      // padrão expert
      const ultimaExecucao =
        // retorna um Json com o ID do ultimo treino
        await this.treinoRepository.buscarUltimaExecucao(usuarioId);

      let proximoTipo: "A" | "B" | "C" = "A";

      // Ele aplica uma regra de coordenação básica (A -> B -> C)
      if (ultimaExecucao) {
        const tipos: ("A" | "B" | "C")[] = ["A", "B", "C"];
        const treinoAnterior = await this.treinoRepository.buscarFichaPorId(
          ultimaExecucao.treinoId,
        );

        // 1. Pegamos o que veio do banco
        const tipoDoTreinoNoBD = treinoAnterior.tipo;

        // 2. O dado do banco é válido? (Está dentro de A, B ou C?)
        if (tipos.includes(tipoDoTreinoNoBD as any)) {
          // Sim, é válido! Podemos confiar na matemática.
          const indexAnterior = tipos.indexOf(tipoDoTreinoNoBD as any);
          // define o treino do dia
          proximoTipo = tipos[(indexAnterior + 1) % tipos.length] as
            | "A"
            | "B"
            | "C";
        } else {
          // NÃO! O banco está com lixo ou dados corrompidos.
          // Damos um "grito" no terminal do servidor para o desenvolvedor investigar!
          console.error(
            `🚨 ALERTA CRÍTICO: Treino com tipo inválido encontrado no banco de dados: "${tipoDoTreinoNoBD}". O usuário caiu no Fallback para "A".`,
          );

          // Garantimos que o app do usuário não exploda, voltando para o padrão seguro.
          proximoTipo = "A";
        }
      }

      // Ele DELEGA novamente para buscar a ficha completa (O Molde/Template)
      // precisamos saber qual treino será feito para comparar os valores de carga e repetições com o anterior.
      const fichaDoTreino = await this.treinoRepository.buscarFichaTemplate(
        usuarioId,
        proximoTipo,
      );

      // Buscamos o histórico ESPECÍFICO da última vez que ele fez ESTE treino
      const ultimoTreinoDesseTipo =
        await this.treinoRepository.buscarUltimoTreinoPorTipo(
          usuarioId,
          proximoTipo,
        );

      const respostaDoCoach = {
        sugestao: proximoTipo,
        mensagem: `Bom dia! Hoje é dia de Treino ${proximoTipo}.`,
        exercicios: [] as any[], // Temporário até fecharmos as interfaces
      };

      // Se a ficha existir, comparamos exercício por exercício
      if (fichaDoTreino && fichaDoTreino.exercicios) {
        for (const exercicioMolde of fichaDoTreino.exercicios) {
          let cargaSugerida = 0;
          let dica =
            "Primeiro dia neste exercício! Escolha uma carga leve para focar na execução.";

          if (ultimoTreinoDesseTipo) {
            const historicoExercicio =
              ultimoTreinoDesseTipo.exerciciosExecutados.find(
                (e: any) => e.nome === exercicioMolde.nome,
              );

            if (historicoExercicio) {
              cargaSugerida = historicoExercicio.cargaKg;

              // Ele bateu a meta em TODAS as séries na semana passada?
              const bateuAMeta = historicoExercicio.seriesRealizadas.every(
                (rep: number) => rep >= exercicioMolde.metaRepeticoes,
              );

              if (bateuAMeta) {
                cargaSugerida += 2; // Progrediu!
                dica = `🔥 Monstro! Você bateu a meta na última vez. Sugestão: suba a carga para ${cargaSugerida}kg.`;
              } else {
                const textoReps =
                  historicoExercicio.seriesRealizadas.join(", ");
                dica = `💪 Quase lá! Semana passada você fez [${textoReps}] reps. Mantenha os ${cargaSugerida}kg e lute pelas ${exercicioMolde.metaRepeticoes} hoje!`;
              }
            }
          }

          respostaDoCoach.exercicios.push({
            nome: exercicioMolde.nome,
            metaSeries: exercicioMolde.metaSeries,
            metaRepeticoes: exercicioMolde.metaRepeticoes,
            cargaSugerida: cargaSugerida,
            dicaDoCoach: dica,
          });
        }
      }

      // Ele DELEGA a resposta (res) de volta para a internet com os novos dados
      return res.status(200).json(respostaDoCoach);
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erro Interno no Servidor", error });
    }
  }
}
