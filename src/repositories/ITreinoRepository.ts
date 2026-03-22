// src/repositories/ITreinoRepository.ts

// ============================================================================
// MOLDES DE DADOS (As "Caixas")
// ============================================================================

// --- Domínio do Planejamento ---
export interface IExercicioMolde {
  nome: string;
  metaSeries: number;
  metaRepeticoes: number;
}

export interface IFichaTreino {
  id?: string;
  usuarioId: string;
  tipo: "A" | "B" | "C";
  exercicios: IExercicioMolde[];
}

// --- Domínio da Execução (Histórico) ---
export interface IExercicioRealizado {
  nome: string;
  cargaKg: number;
  seriesRealizadas: number[];
}

export interface IExecucaoTreino {
  id?: string;
  usuarioId: string;
  treinoId: string;
  dataExecucao: Date;
  exerciciosExecutados: IExercicioRealizado[];
}

// ============================================================================
// O CONTRATO DO REPOSITÓRIO (Dívida Técnica: SRP Violado de forma consciente)
// ============================================================================
export interface ITreinoRepository {
  // ------------------------------------------------------------------------
  // RESPONSABILIDADE 1: Gestão de Fichas (O Template/Planejamento)
  // ------------------------------------------------------------------------

  // Busca uma ficha específica pelo ID dela (Ex: "XYZ-123")
  buscarFichaPorId(treinoId: string): Promise<IFichaTreino | null>;

  // Busca a Ficha (Template) do treino específico do usuário (Ex: O treino "A" do João)
  buscarFichaTemplate(
    usuarioId: string,
    tipo: "A" | "B" | "C",
  ): Promise<IFichaTreino | null>;

  // ------------------------------------------------------------------------
  // RESPONSABILIDADE 2: Gestão de Histórico (O Diário/Passado)
  // ------------------------------------------------------------------------

  // Busca a última vez geral que o usuário pisou na academia (para saber o ABC)
  buscarUltimaExecucao(usuarioId: string): Promise<IExecucaoTreino | null>;

  // Busca como ele se saiu na ÚLTIMA vez que fez um treino específico (Ex: A última vez no treino "A")
  buscarUltimoTreinoPorTipo(
    usuarioId: string,
    tipo: "A" | "B" | "C",
  ): Promise<IExecucaoTreino | null>;
}
