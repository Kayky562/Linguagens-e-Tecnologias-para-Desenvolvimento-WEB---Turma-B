/**
 * dados/conexao.js
 * Camada: dados (acesso ao banco).
 *
 * Abre a conexao unica com o SQLite e a compartilha com os demais modulos
 * de dados. O caminho do arquivo vem do .env (configuracao fora do codigo).
 */

require("dotenv").config();
const Database = require("better-sqlite3");

const db = new Database(process.env.DB_ARQUIVO || "achados.db");

// SQLite vem com chave estrangeira DESLIGADA por padrao: sem isto, a FK
// declarada no esquema nao protegeria nada.
db.pragma("foreign_keys = ON");

module.exports = db;
