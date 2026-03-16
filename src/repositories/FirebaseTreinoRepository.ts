// src/repositories/FirebaseTreinoRepository.ts

import {
  ITreinoRepository,
  IFichaTreino,
  IExecucaoTreino,
} from "./ITreinoRepository";

// Na vida real, importaríamos o SDK do Firebase aqui
// import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

export class FirebaseTreinoRepository implements ITreinoRepository {
  // 1. A variável estática secreta que guarda a ÚNICA instância
  private static instancia: FirebaseTreinoRepository;
  private db: any; // Representa a conexão com o banco

  // 2. O famoso Construtor Privado! Ninguém de fora pode dar "new" nesta classe.
  private constructor() {
    // Na vida real: this.db = getFirestore();
    console.log(
      "🔥 [SINGLETON] Conexão com o Firebase Firestore estabelecida!",
    );
  }

  // 3. A porta de entrada pública. Se não existir conexão, cria. Se já existir, devolve a mesma.
  public static getInstance(): FirebaseTreinoRepository {
    if (!FirebaseTreinoRepository.instancia) {
      FirebaseTreinoRepository.instancia = new FirebaseTreinoRepository();
    }
    return FirebaseTreinoRepository.instancia;
  }

  // ============================================================================
  // RESPONSABILIDADE 1: GESTÃO DE FICHAS (O Template/Planejamento)
  // ============================================================================

  async buscarFichaPorId(treinoId: string): Promise<IFichaTreino> {
    console.log(`Buscando a ficha exata com ID: ${treinoId}`);

    /* LOGICA FIREBASE REAL:
        const docRef = doc(this.db, "fichas", treinoId);
        const docSnap = await getDoc(docRef);
        return docSnap.data() as IFichaTreino;
        */

    // Simulando o retorno do banco para não travar seus testes
    return {
      id: treinoId,
      usuarioId: "ID_QUALQUER",
      tipo: "A",
      exercicios: [
        { nome: "Supino Reto", metaSeries: 3, metaRepeticoes: 12 },
        { nome: "Crucifixo", metaSeries: 3, metaRepeticoes: 15 },
      ],
    };
  }

  async buscarFichaTemplate(
    usuarioId: string,
    tipo: "A" | "B" | "C",
  ): Promise<IFichaTreino | null> {
    console.log(
      `Buscando o template do treino ${tipo} para o usuário ${usuarioId}`,
    );

    /* LOGICA FIREBASE REAL:
        const q = query(collection(this.db, "fichas"), 
            where("usuarioId", "==", usuarioId), 
            where("tipo", "==", tipo)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        return querySnapshot.docs[0].data() as IFichaTreino;
        */

    // Simulação do retorno
    return {
      id: "FICHA_A_123",
      usuarioId: usuarioId,
      tipo: tipo,
      exercicios: [
        { nome: "Supino Reto", metaSeries: 3, metaRepeticoes: 12 },
        { nome: "Crucifixo", metaSeries: 3, metaRepeticoes: 15 },
      ],
    };
  }

  // ============================================================================
  // RESPONSABILIDADE 2: GESTÃO DE HISTÓRICO (O Diário/Passado)
  // ============================================================================

  async buscarUltimaExecucao(
    usuarioId: string,
  ): Promise<IExecucaoTreino | null> {
    console.log(
      `Buscando a última vez geral que o ${usuarioId} foi à academia...`,
    );

    /* LOGICA FIREBASE REAL (Ordena por data decrescente e pega só 1):
        const q = query(collection(this.db, "historico"), 
            where("usuarioId", "==", usuarioId),
            orderBy("dataExecucao", "desc"), 
            limit(1)
        );
        // ... executa e retorna
        */

    // Simulando que ele fez o treino C ontem
    return {
      id: "EXEC_999",
      usuarioId: usuarioId,
      treinoId: "ID_FICHA_C",
      dataExecucao: new Date(),
      exerciciosExecutados: [],
    };
  }

  async buscarUltimoTreinoPorTipo(
    usuarioId: string,
    tipo: "A" | "B" | "C",
  ): Promise<IExecucaoTreino | null> {
    console.log(
      `Buscando o histórico do usuário ${usuarioId} ESPECÍFICO para o treino ${tipo}...`,
    );

    /* LOGICA FIREBASE REAL:
        A query aqui seria um pouco mais complexa ou exigiria saber o ID da ficha de antemão.
        const q = query(collection(this.db, "historico"), 
            where("usuarioId", "==", usuarioId),
            where("tipoTreino", "==", tipo), // (Se salvarmos o tipo junto no histórico para facilitar)
            orderBy("dataExecucao", "desc"),
            limit(1)
        );
        */

    // Simulando o histórico (onde ele não bateu a meta no Supino)
    return {
      id: "EXEC_888",
      usuarioId: usuarioId,
      treinoId: "FICHA_A_123",
      dataExecucao: new Date(),
      exerciciosExecutados: [
        {
          nome: "Supino Reto",
          cargaKg: 40,
          seriesRealizadas: [13, 12, 12], // A nossa lógica do Coach vai analisar isso aqui!
        },
      ],
    };
  }
}
