/**
 * dados/objetos.js
 * Camada: dados. Unico arquivo que conhece o SQL da tabela objeto.
 * Todas as consultas sao parametrizadas (nenhuma concatenacao).
 */

const db = require("./conexao");

/**
 * Lista objetos com o nome de quem cadastrou (consulta com JOIN).
 * Filtros opcionais: texto de busca (titulo/descricao/local) e status.
 * @param {{busca?: string|null, status?: string|null}} filtros
 * @returns {Array<object>} objetos, do mais recente para o mais antigo
 */
function listar({ busca = null, status = null } = {}) {
  return db
    .prepare(
      `SELECT o.id, o.titulo, o.descricao, o.local_encontrado, o.data_encontrado,
              o.status, o.usuario_id, u.nome AS cadastrado_por
         FROM objeto o
         JOIN usuario u ON u.id = o.usuario_id
        WHERE (@status IS NULL OR o.status = @status)
          AND (@busca IS NULL
               OR o.titulo LIKE '%' || @busca || '%'
               OR o.descricao LIKE '%' || @busca || '%'
               OR o.local_encontrado LIKE '%' || @busca || '%')
        ORDER BY o.id DESC`
    )
    .all({ busca, status });
}

/**
 * Busca um objeto pelo id (com o nome de quem cadastrou).
 * @returns {object|undefined} undefined se nao existir
 */
function buscarPorId(id) {
  return db
    .prepare(
      `SELECT o.*, u.nome AS cadastrado_por
         FROM objeto o JOIN usuario u ON u.id = o.usuario_id
        WHERE o.id = ?`
    )
    .get(id);
}

/**
 * Insere um objeto.
 * @param {{titulo:string, descricao:string|null, local:string, data:string, usuarioId:number}} d
 * @returns {number} id criado
 */
function criar({ titulo, descricao, local, data, usuarioId }) {
  const r = db
    .prepare(
      `INSERT INTO objeto (titulo, descricao, local_encontrado, data_encontrado, usuario_id)
       VALUES (@titulo, @descricao, @local, @data, @usuarioId)`
    )
    .run({ titulo, descricao, local, data, usuarioId });
  return Number(r.lastInsertRowid);
}

/**
 * Atualiza os campos editaveis de um objeto.
 * @returns {number} linhas afetadas (0 = id nao encontrado)
 */
function atualizar(id, { titulo, descricao, local, data }) {
  return db
    .prepare(
      `UPDATE objeto SET titulo = @titulo, descricao = @descricao,
              local_encontrado = @local, data_encontrado = @data
        WHERE id = @id`
    )
    .run({ id, titulo, descricao, local, data }).changes;
}

/**
 * Marca o objeto como devolvido.
 * @returns {number} linhas afetadas
 */
function marcarDevolvido(id) {
  return db.prepare("UPDATE objeto SET status = 'devolvido' WHERE id = ?").run(id).changes;
}

/**
 * Remove um objeto.
 * @returns {number} linhas afetadas
 * @throws erro SQLITE_CONSTRAINT_FOREIGNKEY se ainda houver reivindicacoes
 */
function remover(id) {
  return db.prepare("DELETE FROM objeto WHERE id = ?").run(id).changes;
}

module.exports = { listar, buscarPorId, criar, atualizar, marcarDevolvido, remover };
