/**
 * esquema.js
 * Camada: dados (criacao do esquema do banco).
 *
 * Cria as tabelas e indices se ainda nao existirem (idempotente: pode rodar
 * varias vezes). E chamado pelo app.js ao subir e pelo seed.js.
 *
 * Qual restricao protege qual regra:
 *  - usuario.email UNIQUE ........ nao existem duas contas com o mesmo e-mail
 *  - CHECK em usuario.papel ...... so existem os papeis 'usuario' e 'admin'
 *  - CHECK em objeto.status ...... so 'disponivel' ou 'devolvido'
 *  - UNIQUE (objeto_id, usuario_id) em reivindicacao: a mesma pessoa nao
 *    reivindica o mesmo objeto duas vezes (vale mesmo com requisicoes
 *    simultaneas, onde verificar antes no codigo nao bastaria)
 *  - FKs ......................... nao existe objeto sem dono nem
 *    reivindicacao sem objeto/autor
 */

const db = require("./dados/conexao");

/** Cria tabelas e indices (CREATE ... IF NOT EXISTS). */
function criarEsquema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuario (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      papel      TEXT NOT NULL DEFAULT 'usuario' CHECK (papel IN ('usuario', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS objeto (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo           TEXT NOT NULL,
      descricao        TEXT,
      local_encontrado TEXT NOT NULL,
      data_encontrado  TEXT NOT NULL,
      status           TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'devolvido')),
      usuario_id       INTEGER NOT NULL REFERENCES usuario(id),
      criado_em        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reivindicacao (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      objeto_id  INTEGER NOT NULL REFERENCES objeto(id),
      usuario_id INTEGER NOT NULL REFERENCES usuario(id),
      mensagem   TEXT NOT NULL,
      criado_em  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (objeto_id, usuario_id)
    );

    -- Indices nas colunas usadas em WHERE e JOIN (o UNIQUE acima ja cobre objeto_id).
    CREATE INDEX IF NOT EXISTS idx_objeto_usuario ON objeto (usuario_id);
    CREATE INDEX IF NOT EXISTS idx_objeto_status  ON objeto (status);
    CREATE INDEX IF NOT EXISTS idx_reiv_usuario   ON reivindicacao (usuario_id);
  `);
}

module.exports = { criarEsquema };

// Rodado direto (node esquema.js): apenas cria o esquema.
if (require.main === module) {
  criarEsquema();
  console.log("Esquema criado.");
}
