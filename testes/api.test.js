
/**
 * testes/api.test.js
 * Testes automatizados da API de Achados e Perdidos.
 *
 * Utiliza um banco SQLite temporario para nao alterar
 * os dados reais ou os dados de demonstracao.
 */

"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const bcrypt = require("bcrypt");

// Configura o ambiente de testes ANTES de importar a aplicacao.
const pastaTemporaria = fs.mkdtempSync(
  path.join(os.tmpdir(), "achados-testes-")
);

process.env.DB_ARQUIVO = path.join(
  pastaTemporaria,
  "testes.db"
);

process.env.JWT_SECRET =
  "segredo-exclusivo-dos-testes-automatizados-2026";

process.env.LIMITE_AUTH = "100";

const db = require("../dados/conexao");
const { criarEsquema } = require("../esquema");
const app = require("../app");

let servidor;
let endereco;
let tokenAna;
let tokenBruno;
let tokenAdmin;
let objetoId;

/**
 * Executa uma requisicao HTTP na instancia de testes.
 * Retorna o status e o corpo da resposta.
 */
async function chamar(
  rota,
  { metodo = "GET", token, corpo } = {}
) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (corpo !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const resposta = await fetch(`${endereco}${rota}`, {
    method: metodo,
    headers,
    body: corpo === undefined
      ? undefined
      : JSON.stringify(corpo)
  });

  const dados = resposta.status === 204
    ? null
    : await resposta.json();

  return {
    status: resposta.status,
    dados
  };
}

/** Cria usuarios ficticios apenas no banco de testes. */
function prepararUsuarios() {
  const inserir = db.prepare(`
    INSERT INTO usuario (nome, email, senha_hash, papel)
    VALUES (?, ?, ?, ?)
  `);

  inserir.run(
    "Administrador Teste",
    "admin@teste.com",
    bcrypt.hashSync("Admin@123", 10),
    "admin"
  );

  inserir.run(
    "Ana Teste",
    "ana@teste.com",
    bcrypt.hashSync("Senha@123", 10),
    "usuario"
  );

  inserir.run(
    "Bruno Teste",
    "bruno@teste.com",
    bcrypt.hashSync("Senha@123", 10),
    "usuario"
  );
}

// Inicia um servidor separado, em uma porta livre.
before(async () => {
  criarEsquema();
  prepararUsuarios();

  servidor = app.listen(0, "127.0.0.1");

  await new Promise((resolver, rejeitar) => {
    servidor.once("listening", resolver);
    servidor.once("error", rejeitar);
  });

  endereco = `http://127.0.0.1:${servidor.address().port}`;
});

// Fecha o servidor e exclui o banco temporario.
after(async () => {
  if (servidor) {
    await new Promise((resolver, rejeitar) => {
      servidor.close((erro) => {
        if (erro) rejeitar(erro);
        else resolver();
      });
    });
  }

  db.close();

  fs.rmSync(pastaTemporaria, {
    recursive: true,
    force: true
  });
});

test("01 - API responde ao teste de saude", async () => {
  const resposta = await chamar("/saude");

  assert.equal(resposta.status, 200);
  assert.equal(resposta.dados.status, "ok");
});

test("02 - Banco de testes inicia sem objetos", async () => {
  const resposta = await chamar("/objetos");

  assert.equal(resposta.status, 200);
  assert.deepEqual(resposta.dados, []);
});

test("03 - Cadastro publico nao permite criar admin", async () => {
  const resposta = await chamar("/auth/registro", {
    metodo: "POST",
    corpo: {
      nome: "Novo Usuario",
      email: "novo@teste.com",
      senha: "Senha@123",
      papel: "admin"
    }
  });

  assert.equal(resposta.status, 201);
  assert.equal(resposta.dados.papel, "usuario");

  const duplicado = await chamar("/auth/registro", {
    metodo: "POST",
    corpo: {
      nome: "Novo Usuario",
      email: "novo@teste.com",
      senha: "Senha@123"
    }
  });

  assert.equal(duplicado.status, 409);
});

test("04 - Login gera JWT e valida o usuario", async () => {
  const contas = [
    ["ana@teste.com", "Senha@123", "ana"],
    ["bruno@teste.com", "Senha@123", "bruno"],
    ["admin@teste.com", "Admin@123", "admin"]
  ];

  for (const [email, senha, conta] of contas) {
    const resposta = await chamar("/auth/login", {
      metodo: "POST",
      corpo: { email, senha }
    });

    assert.equal(resposta.status, 200);
    assert.equal(typeof resposta.dados.token, "string");

    if (conta === "ana") tokenAna = resposta.dados.token;
    if (conta === "bruno") tokenBruno = resposta.dados.token;
    if (conta === "admin") tokenAdmin = resposta.dados.token;
  }

  const perfil = await chamar("/auth/eu", {
    token: tokenAna
  });

  assert.equal(perfil.status, 200);
  assert.equal(perfil.dados.nome, "Ana Teste");
  assert.equal(perfil.dados.papel, "usuario");

  const semToken = await chamar("/auth/eu");
  assert.equal(semToken.status, 401);

  const senhaErrada = await chamar("/auth/login", {
    metodo: "POST",
    corpo: {
      email: "ana@teste.com",
      senha: "SenhaErrada123"
    }
  });

  assert.equal(senhaErrada.status, 401);
});

test("05 - Cadastro de objeto exige autenticacao", async () => {
  const objeto = {
    titulo: "Guarda-chuva de teste",
    descricao: "Guarda-chuva amarelo",
    local_encontrado: "Biblioteca",
    data_encontrado: "2024-10-10"
  };

  const semToken = await chamar("/objetos", {
    metodo: "POST",
    corpo: objeto
  });

  assert.equal(semToken.status, 401);

  const cadastrado = await chamar("/objetos", {
    metodo: "POST",
    token: tokenAna,
    corpo: objeto
  });

  assert.equal(cadastrado.status, 201);
  assert.equal(
    cadastrado.dados.titulo,
    "Guarda-chuva de teste"
  );

  objetoId = cadastrado.dados.id;
});

test("06 - Busca e filtros retornam os objetos", async () => {
  const resposta = await chamar(
    "/objetos?busca=Guarda-chuva&status=disponivel"
  );

  assert.equal(resposta.status, 200);
  assert.equal(resposta.dados.length, 1);
  assert.equal(resposta.dados[0].id, objetoId);

  const invalido = await chamar(
    "/objetos?status=desconhecido"
  );

  assert.equal(invalido.status, 400);
});

test("07 - Bruno nao pode alterar objeto de Ana", async () => {
  const resposta = await chamar(
    `/objetos/${objetoId}/devolucao`,
    {
      metodo: "PATCH",
      token: tokenBruno
    }
  );

  assert.equal(resposta.status, 403);

  const remover = await chamar(`/objetos/${objetoId}`, {
    metodo: "DELETE",
    token: tokenBruno
  });

  assert.equal(remover.status, 403);
});

test("08 - Reivindicacao respeita regras de negocio", async () => {
  const reivindicar = () => chamar(
    `/objetos/${objetoId}/reivindicacoes`,
    {
      metodo: "POST",
      token: tokenBruno,
      corpo: {
        mensagem: "Este objeto pertence a mim."
      }
    }
  );

  const primeira = await reivindicar();
  assert.equal(primeira.status, 201);

  const duplicada = await reivindicar();
  assert.equal(duplicada.status, 409);

  const objetoProprio = await chamar(
    `/objetos/${objetoId}/reivindicacoes`,
    {
      metodo: "POST",
      token: tokenAna,
      corpo: {
        mensagem: "Tentativa de reivindicar meu objeto"
      }
    }
  );

  assert.equal(objetoProprio.status, 409);

  const consultar = await chamar(
    `/objetos/${objetoId}/reivindicacoes`,
    { token: tokenAna }
  );

  assert.equal(consultar.status, 200);
  assert.equal(consultar.dados.length, 1);
});

test("09 - Somente responsavel pode marcar devolucao", async () => {
  const resposta = await chamar(
    `/objetos/${objetoId}/devolucao`,
    {
      metodo: "PATCH",
      token: tokenAna
    }
  );

  assert.equal(resposta.status, 200);
  assert.equal(resposta.dados.status, "devolvido");

  const repetida = await chamar(
    `/objetos/${objetoId}/devolucao`,
    {
      metodo: "PATCH",
      token: tokenAna
    }
  );

  assert.equal(repetida.status, 409);
});

test("10 - Admin respeita historico de reivindicacoes", async () => {
  const resposta = await chamar(`/objetos/${objetoId}`, {
    metodo: "DELETE",
    token: tokenAdmin
  });

  // Objeto com reivindicacao preserva o historico.
  assert.equal(resposta.status, 409);
});

test("11 - Rota inexistente devolve 404", async () => {
  const resposta = await chamar("/rota-inexistente");

  assert.equal(resposta.status, 404);
});
