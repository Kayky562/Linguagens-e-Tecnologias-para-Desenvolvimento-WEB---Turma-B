/**
 * dados/usuarios.js
 * Camada: dados. Unico arquivo que conhece o SQL da tabela usuario.
 *
 * Segurança: TODAS as consultas usam parametros (?). Concatenar a entrada do
 * usuario no SQL permitiria injecao de SQL (ex.: email = "x' OR '1'='1").
 */

const db = require("./conexao");

/**
 * Busca um usuario pelo e-mail (inclui senha_hash, para o login conferir).
 * @param {string} email
 * @returns {{id:number, nome:string, email:string, senha_hash:string, papel:string}|undefined}
 */
function buscarPorEmail(email) {
  return db.prepare("SELECT * FROM usuario WHERE email = ?").get(email);
}

/**
 * Cria um usuario.
 * @param {{nome:string, email:string, senhaHash:string, papel?:string}} dados
 * @returns {number} id criado
 * @throws erro SQLITE_CONSTRAINT_UNIQUE se o e-mail ja existe (tratado em middlewares/erros.js)
 */
function criar({ nome, email, senhaHash, papel = "usuario" }) {
  const r = db
    .prepare("INSERT INTO usuario (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)")
    .run(nome, email, senhaHash, papel);
  return Number(r.lastInsertRowid);
}

module.exports = { buscarPorEmail, criar };
