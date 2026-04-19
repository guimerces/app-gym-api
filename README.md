# 🏋️‍♂️ API Monitor de Treino de Musculação (REST)

REST API desenvolvida em **Node.js** com **TypeScript** e **Express** para gerenciamento de treinos de musculação. O sistema atua como um "Coach Virtual", sugerindo o próximo treino do ciclo (A, B ou C) e calculando a progressão de carga com base no histórico de performance do usuário.

## 🚀 Tecnologias Utilizadas

* **Ecossistema:** Node.js, TypeScript e Express.js.
* **Banco de Dados:** Firebase / Firestore (NoSQL).
* **Segurança & Middlewares:** CORS, Autenticação via Token (estrutura preparada) e validação de requisições.

## 🏗️ Arquitetura e Padrões de Projeto

Este projeto foi construído focando na **Separação de Responsabilidades (SoC)** e na facilidade de manutenção, aplicando fortemente os princípios **SOLID** e **Arquitetura MVC (Model-View-Controller)** adaptada para APIs.

* **Padrão Controller (`TreinoController`):** Responsável exclusivo por interceptar as requisições HTTP (Req/Res), extrair os parâmetros e delegar as regras de negócio para as camadas inferiores, retornando os status codes corretos.
* **Padrão Repository (`ITreinoRepository` & `FirebaseTreinoRepository`):** A camada de persistência de dados foi totalmente abstraída. O Controller não sabe que o Firebase existe. Ele se comunica apenas com a interface `ITreinoRepository`. Isso garante o princípio de *Inversão de Dependência*, permitindo trocar o banco de dados futuro sem alterar a lógica da aplicação.
* **Injeção de Dependência:** O Controller recebe sua dependência de repositório via construtor, facilitando a criação de *Mocks* para testes unitários.
* **Padrão Singleton:** Aplicado na classe `FirebaseTreinoRepository` para garantir que apenas uma instância de conexão com o banco de dados seja criada e reutilizada durante todo o ciclo de vida da aplicação.

## 🧠 Lógica de Negócio (O "Motor do Coach")

A rota de sugestão de treino (`/sugestao`) implementa uma regra de coordenação inteligente:
1. **Roteamento de Ciclo:** Identifica o último treino executado pelo usuário no histórico e sugere o próximo da sequência lógica (Ex: Se fez 'A', sugere 'B').
2. **Progressão de Carga (Overload):** Compara a ficha template atual com o histórico da última execução daquele treino específico.
3. **Feedback Dinâmico:** Se o aluno bateu a meta de repetições na semana anterior, a API sugere um aumento de carga (+2kg). Caso contrário, incentiva a manutenção da carga para focar em atingir a meta de repetições.
4. **Resiliência (Fallback):** Caso o histórico de banco de dados aponte para dados inconsistentes, o sistema realiza um fallback seguro para o "Treino A", evitando crashes na aplicação cliente.

## 📍 Endpoints Principais

### Motor do Coach
* `GET /usuarios/:usuarioId/treinos/sugestao` - Retorna o próximo treino e o feedback de cargas.

### Execuções (Histórico)
* `POST /usuarios/:usuarioId/execucoes` - Salva um treino realizado.
* `PUT /execucoes/:id` - Atualiza dados/pesos de um treino já salvo.

### Fichas (Templates)
* `POST /fichas` - Cria um novo molde de treino (A, B ou C).
* `GET /usuarios/:usuarioId/fichas` - Lista os templates do aluno.
* `DELETE /fichas/:id` - Remove uma ficha.

## ⚙️ Como Executar o Projeto Localmente

1. Clone o repositório:
   ```bash
   git clone [https://github.com/seu-usuario/nome-do-repositorio.git](https://github.com/seu-usuario/nome-do-repositorio.git)

2. Instale as dependências:
  ```bash
      npm install
  ```

3. Configure as variáveis de ambiente:
Crie um arquivo .env na raiz do projeto e insira suas credenciais do Firebase:
  FIREBASE_PROJECT_ID="seu_project_id"
  FIREBASE_CLIENT_EMAIL="seu_client_email"
  FIREBASE_PRIVATE_KEY="sua_private_key"
  PORT=3000

4. Execute o servidor em modo de desenvolvimento:
   npm run dev

## 🚧 Próximos Passos (Em Desenvolvimento)

* **Segurança e Autenticação:** Finalização da implementação de JWT (JSON Web Tokens) no `authMiddleware` para proteger as rotas privadas, garantindo que usuários acessem e modifiquem apenas os seus próprios dados.
* **Testes Automatizados:** Criação de testes unitários para a regra de negócio do motor de sugestão e progressão de cargas utilizando Jest.
