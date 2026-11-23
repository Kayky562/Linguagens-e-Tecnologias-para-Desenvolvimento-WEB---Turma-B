/**
 * dados/relatorios.js
 * Camada: dados. Consultas de agregacao usadas pelo relatorio do admin.
 */

const db = require("./conexao");

/**
 * Quantidade de objetos por status (agregacao com GROUP BY).
 * @returns {Array<{status:string, total:number}>}
 */
function contarPorStatus() {
  return db.prepare("SELECT status, COUNT(*) AS total FROM objeto GROUP BY status").all();
}

/**
 * Objetos mais reivindicados (JOIN + COUNT + GROUP BY).
 * LEFT JOIN para que objetos sem reivindicacao tambem aparecam (com 0).
 * @param {number} limite quantos objetos devolver
 * @returns {Array<{id:number, titulo:string, reivindicacoes:number}>}
 */
function maisReivindicados(limite) {
  return db
    .prepare(
      `SELECT o.id, o.titulo, COUNT(r.id) AS reivindicacoes
         FROM objeto o
         LEFT JOIN reivindicacao r ON r.objeto_id = o.id
        GROUP BY o.id, o.titulo
        ORDER BY reivindicacoes DESC, o.id
        LIMIT ?`
    )
    .all(limite);
}

module.exports = { contarPorStatus, maisReivindicados };
