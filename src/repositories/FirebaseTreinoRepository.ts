// src/repositories/FirebaseTreinoRepository.ts

import {
  ITreinoRepository,
  IExecucaoTreino,
  IFichaTreino,
} from "./ITreinoRepository";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config(); // Carrega as variáveis do ambiente

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      // Colocamos o "as string" para garantir ao TS que a variável vai existir
      projectId: process.env.FIREBASE_PROJECT_ID as string,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
      // Usamos um fallback (|| "") caso venha vazio, para o .replace não quebrar
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
        /\\n/g,
        "\n",
      ),
    }),
  });
}

const db = admin.firestore();

// class FirebaseTreinoRepository
export class FirebaseTreinoRepository implements ITreinoRepository {
  // Padrão Singleton
  private static instance: FirebaseTreinoRepository;

  private constructor() {
    // Vamos colocar um log aqui para sabermos quando a conexão der certo!
    console.log(
      "🔥 Conexão com o Firebase Firestore estabelecida com sucesso!",
    );
  }

  public static getInstance(): FirebaseTreinoRepository {
    if (!FirebaseTreinoRepository.instance) {
      FirebaseTreinoRepository.instance = new FirebaseTreinoRepository();
    }
    return FirebaseTreinoRepository.instance;
  }

  // primeiro pedido do controller
  async buscarUltimaExecucao(
    usuarioId: string,
  ): Promise<IExecucaoTreino | null> {
    console.log(
      `🔍 Buscando a última execução real do usuário ${usuarioId} no Firebase...`,
    );

    // 1. Vai na coleção "execucoes" e pega tudo desse usuário
    const snapshot = await db
      .collection("execucoes")
      .where("usuarioId", "==", usuarioId)
      .get();

    // 2. Se ele nunca treinou na vida, retorna null
    if (snapshot.empty) {
      console.log("❌ Nenhuma execução encontrada no histórico.");
      return null;
    }

    // 3. Transforma os documentos do Google em objetos JavaScript
    const execucoes = snapshot.docs.map((doc) => doc.data() as IExecucaoTreino);

    // 4. Ordena pela data (da mais recente para a mais antiga)
    execucoes.sort(
      (a, b) =>
        new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime(),
    );

    // 5. Devolve a primeiríssima da lista (a de ontem!)
    return execucoes[0] || null;
  }

  // segundo pedido do controller
  async buscarFichaPorId(treinoId: string): Promise<IFichaTreino | null> {
    console.log(`🔍 Buscando a ficha exata com ID: ${treinoId} no Firebase...`);

    // 1. Vai direto no "arquivo" com esse ID dentro da pasta "fichas"
    const docSnap = await db.collection("fichas").doc(treinoId).get();

    // 2. Se o arquivo não existir, retorna nulo
    if (!docSnap.exists) {
      console.log("❌ Ficha não encontrada pelo ID.");
      return null;
    }

    // 3. Se existir, extrai o JSON e devolve pro Controller
    const fichaReal = docSnap.data() as IFichaTreino;
    return fichaReal;
  }

  // terceiro pedido do controller
  async buscarFichaTemplate(
    usuarioId: string,
    tipo: "A" | "B" | "C",
  ): Promise<IFichaTreino | null> {
    console.log(
      `🔍 Buscando ficha ${tipo} para o usuário ${usuarioId} no Firebase...`,
    );

    // 1. A Consulta (A Query)
    // Isso é o equivalente ao SQL: SELECT * FROM fichas WHERE usuarioId = 'JOAO123' AND tipo = 'A'
    const snapshot = await db
      .collection("fichas")
      .where("usuarioId", "==", usuarioId)
      .where("tipo", "==", tipo)
      .get();

    // 2. Se a busca voltar vazia, retorna nulo
    if (snapshot.empty) {
      console.log("❌ Nenhuma ficha encontrada.");
      return null;
    }

    // Isolamos o primeiro documento para o TypeScript analisar
    const primeiroDocumento = snapshot.docs[0];

    // Garantia dupla para o TypeScript parar de reclamar
    if (!primeiroDocumento) {
      return null;
    }

    // 3. Agora o TypeScript tem 100% de certeza que existe, e libera o .data()
    const documentoReal = primeiroDocumento.data() as IFichaTreino;

    console.log("✅ Ficha encontrada com sucesso!");
    return documentoReal;
  }

  // quarto pedido do controller
  async buscarUltimoTreinoPorTipo(
    usuarioId: string,
    tipo: "A" | "B" | "C",
  ): Promise<IExecucaoTreino | null> {
    console.log(
      `🔍 Buscando o histórico ESPECÍFICO do Treino ${tipo} para o usuário ${usuarioId}...`,
    );

    // 1. Busca na coleção de execuções filtrando pelo aluno E pela letra do treino
    const snapshot = await db
      .collection("execucoes")
      .where("usuarioId", "==", usuarioId)
      .where("tipo", "==", tipo)
      .get();

    // 2. Se ele nunca fez esse treino na vida, o Coach vai saber que é a primeira vez!
    if (snapshot.empty) {
      console.log(`❌ Nenhum histórico encontrado para o Treino ${tipo}.`);
      return null;
    }

    // 3. Converte para JavaScript e ordena pela data mais recente
    const execucoes = snapshot.docs.map((doc) => doc.data() as IExecucaoTreino);
    execucoes.sort(
      (a, b) =>
        new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime(),
    );

    // 4. Devolve a execução mais recente desse tipo específico, com proteção contra undefined
    return execucoes[0] || null;
  }

  async salvarExecucao(execucao: IExecucaoTreino): Promise<void> {
    console.log(
      `💾 Salvando treino (Ficha ID: ${execucao.treinoId}) do usuário ${execucao.usuarioId}...`,
    );

    // 1. Preparamos a "pasta" no Firebase.
    // Se o objeto já tem um ID, usamos ele. Se não tem, o .doc() vazio manda o Google gerar um ID único na hora.
    const docRef = execucao.id
      ? db.collection("execucoes").doc(execucao.id)
      : db.collection("execucoes").doc();

    // 2. Garantimos que o ID gerado pelo Google fique salvo dentro do próprio JSON também
    const dadosParaSalvar = {
      ...execucao,
      id: docRef.id,
    };

    // 3. Salva definitivamente no banco de dados
    await docRef.set(dadosParaSalvar);

    console.log(`✅ Treino salvo com sucesso! ID da execução: ${docRef.id}`);
  }

  async buscarFichasPorUsuario(usuarioId: string): Promise<IFichaTreino[]> {
    console.log(`🔍 Buscando todas as fichas do usuário ${usuarioId}...`);
    const snapshot = await db
      .collection("fichas")
      .where("usuarioId", "==", usuarioId)
      .get();

    return snapshot.docs.map((doc) => doc.data() as IFichaTreino);
  }

  async deletarFicha(fichaId: string): Promise<void> {
    console.log(`🗑️ Deletando a ficha ${fichaId}...`);
    await db.collection("fichas").doc(fichaId).delete();
  }

  async atualizarExecucao(
    execucaoId: string,
    exerciciosAtualizados: any[],
  ): Promise<void> {
    console.log(`✏️ Atualizando pesos do treino ${execucaoId}...`);

    // O comando .update() do Firebase altera apenas o campo que você mandar!
    await db.collection("execucoes").doc(execucaoId).update({
      exerciciosExecutados: exerciciosAtualizados,
    });
  }

  async salvarFichaTemplate(ficha: IFichaTreino): Promise<void> {
    console.log(
      `📝 Cadastrando a Ficha ${ficha.tipo} para o usuário ${ficha.usuarioId}...`,
    );

    // Se o Controller mandou um ID (o que ele faz), nós usamos. Senão, geramos um novo.
    const docRef = ficha.id
      ? db.collection("fichas").doc(ficha.id)
      : db.collection("fichas").doc();

    const dadosParaSalvar = {
      ...ficha,
      id: docRef.id,
    };

    // Usamos o set() para fazer o Upsert (Cria se não existir, atualiza se existir)
    await docRef.set(dadosParaSalvar);

    console.log(`✅ Ficha ${ficha.tipo} salva com sucesso no banco!`);
  }

  // Função temporária para popular o banco
  async popularBancoDeTeste(): Promise<void> {
    const usuarioId = "GUILHERME3104";

    // 1. Cadastramos as Três Fichas (A, B e C) - Treino Avançado!
    const fichaA = {
      treinoId: `FICHA_A_${usuarioId}`,
      usuarioId: usuarioId,
      tipo: "A",
      exercicios: [
        {
          nome: "Desenvolvimento com Halteres",
          metaSeries: 4,
          metaRepeticoes: 10,
        },
        { nome: "Tríceps Pulley", metaSeries: 3, metaRepeticoes: 12 },
      ],
    };

    const fichaB = {
      treinoId: `FICHA_B_${usuarioId}`,
      usuarioId: usuarioId,
      tipo: "B",
      exercicios: [
        { nome: "Puxada Frontal", metaSeries: 4, metaRepeticoes: 12 },
        { nome: "Rosca Direta", metaSeries: 3, metaRepeticoes: 15 },
      ],
    };

    const fichaC = {
      treinoId: `FICHA_C_${usuarioId}`,
      usuarioId: usuarioId,
      tipo: "C",
      exercicios: [
        { nome: "Leg Press 45", metaSeries: 4, metaRepeticoes: 10 },
        { nome: "Cadeira Extensora", metaSeries: 3, metaRepeticoes: 15 },
      ],
    };

    await db.collection("fichas").doc(fichaA.treinoId).set(fichaA);
    await db.collection("fichas").doc(fichaB.treinoId).set(fichaB);
    await db.collection("fichas").doc(fichaC.treinoId).set(fichaC);

    // 2. Histórico 1: Guilherme fez a Ficha B há 7 dias! (Para o Coach analisar)
    const execucaoSemanaPassada = {
      execucaoId: `EXEC_7DIAS_${usuarioId}`,
      treinoId: fichaB.treinoId,
      usuarioId: usuarioId,
      tipo: "B",
      // Data de 7 dias atrás
      dataExecucao: new Date(Date.now() - 7 * 86400000).toISOString(),
      exerciciosExecutados: [
        {
          nome: "Puxada Frontal",
          cargaKg: 45,
          // BATEU A META! (4 séries de 12)
          seriesRealizadas: [12, 12, 12, 12],
        },
        {
          nome: "Rosca Direta",
          cargaKg: 12,
          // FALHOU NA ÚLTIMA! (Fez 15, 15, mas a última só aguentou 10)
          seriesRealizadas: [15, 15, 10],
        },
      ],
    };

    // 3. Histórico 2: Guilherme fez a Ficha A ONTEM! (Logo, hoje tem que ser o B)
    const execucaoOntem = {
      execucaoId: `EXEC_ONTEM_${usuarioId}`,
      treinoId: fichaA.treinoId,
      usuarioId: usuarioId,
      tipo: "A",
      // Data de 1 dia atrás
      dataExecucao: new Date(Date.now() - 86400000).toISOString(),
      exerciciosExecutados: [
        {
          nome: "Desenvolvimento com Halteres",
          cargaKg: 20,
          seriesRealizadas: [10, 10, 10, 10],
        },
        {
          nome: "Tríceps Pulley",
          cargaKg: 15,
          seriesRealizadas: [12, 12, 12],
        },
      ],
    };

    // Salvamos tudo no histórico do banco de dados
    await db
      .collection("execucoes")
      .doc(execucaoSemanaPassada.execucaoId)
      .set(execucaoSemanaPassada);
    await db
      .collection("execucoes")
      .doc(execucaoOntem.execucaoId)
      .set(execucaoOntem);

    console.log(
      `✅ Novo Multiverso criado! Fichas de ${usuarioId} e histórico (A e B) inseridos com sucesso!`,
    );
  }
}
