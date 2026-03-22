// src/repositories/ITreinoRepository.ts

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

export interface ITreinoRepository {
  // lógica para buscar o proximo treino e passar o feedback de carga
  buscarUltimaExecucao(usuarioId: string): Promise<IExecucaoTreino | null>;

  buscarFichaPorId(treinoId: string): Promise<IFichaTreino | null>;

  buscarFichaTemplate(
    usuarioId: string,
    tipo: "A" | "B" | "C",
  ): Promise<IFichaTreino | null>;

  buscarUltimoTreinoPorTipo(
    usuarioId: string,
    tipo: "A" | "B" | "C",
  ): Promise<IExecucaoTreino | null>;

  // outras rotas
  salvarExecucao(execucao: IExecucaoTreino): Promise<void>;

  buscarFichasPorUsuario(usuarioId: string): Promise<IFichaTreino[]>;

  deletarFicha(fichaId: string): Promise<void>;

  salvarFichaTemplate(ficha: IFichaTreino): Promise<void>;

  popularBancoDeTeste(): Promise<void>;

  atualizarExecucao(
    execucaoId: string,
    exerciciosAtualizados: any[],
  ): Promise<void>;
}
