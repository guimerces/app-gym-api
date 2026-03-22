// src/controllers/TreinoController.ts
import { Request, Response } from "express";
import { ITreinoRepository } from "../repositories/ITreinoRepository";

export class TreinoController {
  // Na instanciação do controller decidimos a classe que implementará a interface: injeção de dependência
  constructor(private treinoRepository: ITreinoRepository) {}

  // APLICAÇÃO DO PADRÃO CONTROLLER

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

        if (!treinoAnterior) {
          console.log(
            "⚠️ Alerta: Histórico aponta para uma ficha apagada. Recomeçando do A.",
          );
          // Como não achamos a ficha anterior para saber qual era, recomeçamos o ciclo do zero
          const fichaPadrao = await this.treinoRepository.buscarFichaTemplate(
            usuarioId,
            "A",
          );

          // Precisamos desse if extra porque a buscarFichaTemplate também pode retornar nulo!
          if (!fichaPadrao)
            throw new Error("Ficha A não configurada no banco!");

          return res.status(200).json({
            sugestao: "A",
            mensagem:
              "Sua ficha anterior foi alterada. Vamos recomeçar pelo Treino A!",
            exercicios: fichaPadrao.exercicios.map((ex) => ({
              ...ex,
              cargaSugerida: 10,
              dicaDoCoach: "Recomeçando ciclo.",
            })),
          });
        }

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

  async salvarTreinoFeito(req: Request, res: Response) {
    try {
      // 1. Quem é o usuário? (Vem da URL). Garantimos uma string como prometido no contrato
      const usuarioId = req.params.usuarioId as string;

      // 2. O que ele levantou hoje? (Vem do corpo da requisição - JSON do celular)
      const dadosDoCelular = req.body;

      // 3. O Guarda-Costas: O aplicativo mandou tudo o que precisamos?
      if (!dadosDoCelular.treinoId || !dadosDoCelular.exerciciosExecutados) {
        return res.status(400).json({
          erro: "Faltam dados obrigatórios. Certifique-se de enviar 'treinoId' e a lista de 'exerciciosExecutados'.",
        });
      }

      // 4. Montamos o objeto perfeitamente tipado para o Banco (IExecucaoTreino)
      const novaExecucao = {
        // Não passamos o "id", pois deixamos o Firebase gerar um novinho na hora!
        usuarioId: usuarioId,
        treinoId: dadosDoCelular.treinoId, // A chave estrangeira perfeita
        dataExecucao: new Date(), // Registramos a hora exata de AGORA
        exerciciosExecutados: dadosDoCelular.exerciciosExecutados,
      };

      // 5. Delegamos ao Repositório o trabalho sujo de gravar no Firebase
      await this.treinoRepository.salvarExecucao(novaExecucao);

      // 6. Respondemos ao aplicativo com o Status 201 (Created - Criado com sucesso)
      return res.status(201).json({
        mensagem: "🔥 Treino salvo com sucesso, monstro!",
        fichaFeita: novaExecucao.treinoId,
      });
    } catch (error) {
      console.error("Erro ao salvar o treino:", error);
      return res
        .status(500)
        .json({ erro: "Erro interno do servidor ao tentar salvar o treino." });
    }
  }

  async criarFichaTemplate(req: Request, res: Response) {
    try {
      const dadosDoProfessor = req.body;

      // 1. O Guarda-Costas: O Professor preencheu tudo?
      if (
        !dadosDoProfessor.usuarioId ||
        !dadosDoProfessor.tipo ||
        !dadosDoProfessor.exercicios
      ) {
        return res.status(400).json({
          erro: "Dados incompletos. Informe usuarioId, tipo (A, B ou C) e a lista de exercicios.",
        });
      }

      // 2. Montamos a "Planta da Casa" (O Template oficial)
      const novaFicha = {
        // Criamos aquele ID inteligente e previsível
        id: `FICHA_${dadosDoProfessor.tipo}_${dadosDoProfessor.usuarioId}`,
        usuarioId: dadosDoProfessor.usuarioId,
        tipo: dadosDoProfessor.tipo,
        exercicios: dadosDoProfessor.exercicios,
      };

      // 3. Mandamos o Repositório guardar na gaveta de Fichas
      await this.treinoRepository.salvarFichaTemplate(novaFicha);

      // 4. Respondemos ao painel do Professor que deu tudo certo!
      return res.status(201).json({
        mensagem: `Sucesso! Ficha ${novaFicha.tipo} criada / atualizada para o aluno ${novaFicha.usuarioId}.`,
        treinoId: novaFicha.id,
      });
    } catch (error) {
      console.error("Erro ao criar a ficha:", error);
      return res
        .status(500)
        .json({ erro: "Erro interno ao tentar salvar a ficha." });
    }
  }

  async listarFichasDoAluno(req: Request, res: Response) {
    try {
      const usuarioId = req.params.usuarioId as string;
      const fichas =
        await this.treinoRepository.buscarFichasPorUsuario(usuarioId);

      return res.status(200).json(fichas);
    } catch (error) {
      console.error("Erro ao listar fichas:", error);
      return res
        .status(500)
        .json({ erro: "Erro interno ao buscar as fichas." });
    }
  }

  async deletarFicha(req: Request, res: Response) {
    try {
      const fichaId = req.params.id as string;
      await this.treinoRepository.deletarFicha(fichaId);

      return res
        .status(200)
        .json({ mensagem: `Ficha ${fichaId} apagada com sucesso.` });
    } catch (error) {
      console.error("Erro ao deletar ficha:", error);
      return res
        .status(500)
        .json({ erro: "Erro interno ao tentar deletar a ficha." });
    }
  }

  async atualizarTreinoFeito(req: Request, res: Response) {
    try {
      const execucaoId = req.params.id as string;
      const { exerciciosExecutados } = req.body;

      // Validação MVP: Mandou a lista nova?
      if (!exerciciosExecutados || exerciciosExecutados.length === 0) {
        return res
          .status(400)
          .json({ erro: "Envie a lista completa de exercícios corrigida." });
      }

      await this.treinoRepository.atualizarExecucao(
        execucaoId,
        exerciciosExecutados,
      );

      return res
        .status(200)
        .json({ mensagem: "Pesos atualizados com sucesso, monstro!" });
    } catch (error) {
      console.error("Erro ao atualizar treino:", error);
      return res
        .status(500)
        .json({ erro: "Erro interno ao atualizar os pesos." });
    }
  }

  async popularBanco(req: Request, res: Response) {
    try {
      // O Controller manda o Repositório trabalhar
      await this.treinoRepository.popularBancoDeTeste();

      // O Controller responde para a Internet que deu tudo certo
      return res
        .status(201)
        .json({ mensagem: "✅ Multiverso do Guilherme criado com sucesso!" });
    } catch (error) {
      console.error("Erro ao popular banco:", error);
      return res
        .status(500)
        .json({ erro: "Erro ao injetar os dados de teste." });
    }
  }
}
