
# Achados e Perdidos

Projeto individual desenvolvido para a AP2 da disciplina
**Linguagens e Tecnologias para Desenvolvimento Web**.

## 1. Sobre o projeto

O Achados e Perdidos é uma aplicação web para cadastrar,
consultar e reivindicar objetos encontrados.

A plataforma permite identificar o responsável pelo cadastro
de cada objeto e controlar sua devolução.

## 2. Tecnologias utilizadas

- Node.js 22
- Express.js
- SQLite (better-sqlite3)
- HTML5, CSS3 e JavaScript
- Fetch API
- bcrypt
- JSON Web Token (JWT)
- Helmet
- express-rate-limit

## 3. Funcionalidades

- Cadastro de usuários.
- Login com autenticação JWT.
- Perfis de usuário e administrador.
- Listagem pública de objetos.
- Pesquisa de objetos por texto e situação.
- Cadastro de objetos encontrados.
- Atualização de objetos pelo responsável ou administrador.
- Registro de reivindicações.
- Consulta de reivindicações com controle de acesso.
- Confirmação da devolução de objetos.
- Exclusão de objetos pelo administrador, respeitando o histórico.
- Relatório administrativo com totais por situação.

## 4. Estrutura do projeto

- `app.js`: servidor Express e integração das rotas.
- `esquema.js`: criação das tabelas do SQLite.
- `seed.js`: dados de demonstração.
- `dados/`: consultas SQL e acesso ao banco.
- `servicos/`: regras de negócio.
- `rotas/`: endpoints HTTP.
- `middlewares/`: autenticação, segurança e tratamento de erros.
- `utils/`: validações e erros da aplicação.
- `public/`: interface HTML, CSS e JavaScript.
- `testes/`: testes automatizados da API.

## 5. Instalação e execução

### Requisitos

- Node.js 22
- npm

Clone o repositório e entre na pasta do projeto.

Instale as dependências:

```bash
npm ci
```

Crie um arquivo `.env` a partir de `.env.example`.

Configure as variáveis:

```env
JWT_SECRET=COLOQUE_AQUI_UM_SEGREDO_ALEATORIO
JWT_EXPIRA=1h
PORTA=3000
DB_ARQUIVO=achados.db
ORIGENS_PERMITIDAS=
```

O `JWT_SECRET` deve conter pelo menos 32 caracteres.
Para gerar uma chave aleatória:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copie a chave gerada apenas para o `.env`.
Nunca publique o segredo no GitHub.

Inicie a aplicação:

```bash
npm start
```

Acesse:

http://localhost:3000

### Dados de demonstração

Para popular o banco:

```bash
npm run seed
```

**Atenção:** esse comando apaga os registros existentes
no banco configurado e recria os dados de demonstração.
Não execute em um banco que contenha dados importantes.

## 6. Usuários de teste

As contas abaixo são exclusivamente para demonstração.

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@achados.com | Admin@123 |
| Usuário | ana@achados.com | Senha@123 |
| Usuário | bruno@achados.com | Senha@123 |

Em produção, devem ser utilizadas senhas individuais e seguras.

## 7. API REST

### Autenticação

| Método | Endpoint | Acesso |
|---|---|---|
| POST | `/auth/registro` | Público |
| POST | `/auth/login` | Público |
| GET | `/auth/eu` | Autenticado |

Exemplo de cadastro:

```json
{
  "nome": "Maria Silva",
  "email": "maria@exemplo.com",
  "senha": "SenhaSegura123"
}
```

Exemplo de login:

```json
{
  "email": "ana@achados.com",
  "senha": "Senha@123"
}
```

O login retorna um token JWT. Para acessar rotas
protegidas, envie o cabeçalho:

`Authorization: Bearer SEU_TOKEN`

### Objetos

| Método | Endpoint | Acesso |
|---|---|---|
| GET | `/objetos` | Público |
| GET | `/objetos/:id` | Público |
| POST | `/objetos` | Autenticado |
| PUT | `/objetos/:id` | Responsável ou admin |
| PATCH | `/objetos/:id/devolucao` | Responsável ou admin |
| DELETE | `/objetos/:id` | Admin |

A listagem aceita os filtros opcionais `busca` e `status`.

Exemplo:

`GET /objetos?busca=mochila&status=disponivel`

Exemplo de cadastro de objeto:

```json
{
  "titulo": "Mochila preta",
  "descricao": "Mochila com caderno",
  "local_encontrado": "Biblioteca",
  "data_encontrado": "2026-11-10"
}
```

### Reivindicações

| Método | Endpoint | Acesso |
|---|---|---|
| POST | `/objetos/:id/reivindicacoes` | Autenticado |
| GET | `/objetos/:id/reivindicacoes` | Responsável ou admin |
| GET | `/reivindicacoes/minhas` | Autenticado |
| GET | `/reivindicacoes/:id` | Usuários autorizados |

Exemplo de reivindicação:

```json
{
  "mensagem": "Acredito que este objeto seja meu."
}
```

### Relatórios e saúde

| Método | Endpoint | Acesso |
|---|---|---|
| GET | `/relatorios/resumo` | Admin |
| GET | `/saude` | Público |

### Códigos HTTP

- `200`: operação realizada ou consulta bem-sucedida.
- `201`: recurso criado.
- `204`: exclusão realizada sem corpo de resposta.
- `400`: dados inválidos.
- `401`: autenticação necessária ou inválida.
- `403`: acesso proibido.
- `404`: recurso não encontrado.
- `409`: conflito com regra de negócio.

As respostas de erro utilizam o formato:

```json
{
  "erro": "Mensagem do erro"
}
```

## 8. Banco de dados

O banco utiliza SQLite com três tabelas relacionadas:

- `usuario`: contas e perfis.
- `objeto`: objetos cadastrados e seus responsáveis.
- `reivindicacao`: solicitações de objetos.

São utilizadas:

- Chaves primárias (PRIMARY KEY).
- Chaves estrangeiras (FOREIGN KEY).
- Campos obrigatórios (NOT NULL).
- Restrições de unicidade (UNIQUE).
- Restrições de valores (CHECK).
- Consultas com JOIN.
- Agregações com COUNT e GROUP BY.
- Consultas SQL parametrizadas.

## 9. Regras de negócio

### Regra 1 — Confirmação de devolução

Somente quem cadastrou o objeto ou um administrador
pode marcá-lo como devolvido.

Um objeto já devolvido não pode ser devolvido novamente.

### Regra 2 — Reivindicação

Um usuário pode reivindicar somente objetos disponíveis
cadastrados por outra pessoa.

O mesmo usuário não pode reivindicar o mesmo objeto duas vezes.

A restrição UNIQUE do banco também protege essa regra.

### Outras regras

- Cadastro público sempre cria o perfil `usuario`.
- Usuários comuns não podem excluir objetos.
- Objetos com reivindicações não podem ser excluídos.
- Objetos devolvidos não podem ser editados.

As regras são verificadas no servidor, não apenas na interface.

## 10. Segurança

O projeto implementa:

- Senhas armazenadas com hash bcrypt.
- Autenticação com JWT.
- Controle de acesso por papel (RBAC).
- Proteção contra acesso indevido a recursos de outros usuários (IDOR).
- Validação de entradas.
- Consultas SQL parametrizadas.
- Limitação de tentativas nas rotas de autenticação.
- Cabeçalhos de segurança com Helmet.
- Configuração de CORS para origens permitidas, quando informadas.
- Tratamento centralizado de erros.
- Arquivo `.env` excluído do versionamento.
- Uso de `textContent` para apresentar dados externos na interface.

O token da interface permanece apenas em memória,
sendo necessário fazer login novamente após atualizar a página.

## 11. Testes automatizados

Execute:

```bash
npm test
```

Os testes utilizam um banco SQLite temporário,
sem alterar os dados de demonstração.

Os cenários implementados verificam:

1. Resposta da rota de saúde.
2. Banco inicialmente vazio.
3. Cadastro público sem elevação para administrador.
4. Login JWT e autenticação.
5. Proteção do cadastro de objetos.
6. Pesquisa e filtros.
7. Bloqueio de alterações por usuários não autorizados.
8. Regras de reivindicação.
9. Permissão para confirmar devolução.
10. Preservação do histórico de reivindicações.
11. Resposta 404 para rota inexistente.

## 12. Interface web

A interface é servida pelo Express e utiliza a Fetch API
para comunicação com o backend.

Ela oferece estados de carregamento, lista vazia,
sucesso e erro, além de impedir o envio repetido
de formulários enquanto uma solicitação está em andamento.

## 13. Versionamento

O projeto utiliza Git e GitHub, com desenvolvimento
em branches e integração por Pull Requests.

Os commits seguem o padrão Conventional Commits,
como `feat:`, `fix:`, `test:` e `docs:`.

Entrega acadêmica identificada pela tag `ap2-entrega`.

## 14. Finalidade

Projeto acadêmico desenvolvido para demonstrar conceitos
de desenvolvimento web, API REST, persistência de dados,
autenticação, autorização, segurança e testes automatizados.