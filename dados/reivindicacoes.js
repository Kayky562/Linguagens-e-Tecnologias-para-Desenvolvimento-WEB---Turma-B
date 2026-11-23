/**
 * dados/reivindicacoes.js
 * Camada: dados. Unico arquivo que conhece o SQL da tabela reivindicacao.
 * Todas as consultas sao parametrizadas.
 */

const db = require("./conexao");

/**
 * Insere uma reivindicacao.
 * @returns {number} id criado
 * @throws SQLITE_CONSTRAINT_UNIQUE se o usuario ja reivindicou este objeto
 */
function criar({ objetoId, usuarioId, mensagem }) {
  const r = db
    .prepare("INSERT INTO reivindicacao (objeto_id, usuario_id, mensagem) VALUES (?, ?, ?)")
    .run(objetoId, usuarioId, mensagem);
  return Number(r.lastInsertRowid);
}

/**
 * Busca uma reivindicacao com dados do autor e do dono do objeto (JOIN).
 * O servico usa o dono do objeto para decidir quem pode ver (anti-IDOR).
 * @returns {object|undefined}
 */
function buscarPorId(id) {
  return db
    .prepare(
      `SELECT r.id, r.objeto_id, r.usuario_id, r.mensagem, r.criado_em,
              u.nome AS autor, o.titulo AS objeto_titulo, o.usuario_id AS dono_objeto_id
         FROM reivindicacao r
         JOIN usuario u ON u.id = r.usuario_id
         JOIN objeto  o ON o.id = r.objeto_id
        WHERE r.id = ?`
    )
    .get(id);
}

/**
 * Lista as reivindicacoes de um objeto, com o nome de quem reivindicou.
 * @returns {Array<object>}
 */
function listarPorObjeto(objetoId) {
  return db
    .prepare(
      `SELECT r.id, r.objeto_id, r.usuario_id, r.mensagem, r.criado_em, u.nome AS autor
         FROM reivindicacao r JOIN usuario u ON u.id = r.usuario_id
        WHERE r.objeto_id = ?
        ORDER BY r.id`
    )
    .all(objetoId);
}

/**
 * Lista as reivindicacoes feitas por um usuario.
 * @returns {Array<object>}
 */
function listarPorUsuario(usuarioId) {
  return db
    .prepare(
      `SELECT r.id, r.objeto_id, r.mensagem, r.criado_em, o.titulo AS objeto_titulo, o.status AS objeto_status
         FROM reivindicacao r JOIN objeto o ON o.id = r.objeto_id
        WHERE r.usuario_id = ?
        ORDER BY r.id DESC`
    )
    .all(usuarioId);
}

/**
 * Conta as reivindicacoes de um objeto (agregacao COUNT).
 * @returns {number}
 */
function contarPorObjeto(objetoId) {
  return db.prepare("SELECT COUNT(*) AS total FROM reivindicacao WHERE objeto_id = ?").get(objetoId).total;
}

module.exports = { criar, buscarPorId, listarPorObjeto, listarPorUsuario, contarPorObjeto };
