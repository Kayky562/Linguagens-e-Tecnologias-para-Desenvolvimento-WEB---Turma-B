/**
 * middlewares/erros.js
 * Camada: middlewares (HTTP). Tratamento CENTRALIZADO de erros.
 *
 * Toda falha (regra violada, validacao, banco, bug) vira resposta aqui, num
 * unico formato: { erro: "mensagem" } com o status HTTP correto.
 */

const { ErroHttp } = require("../utils/erros");

/** Responde 404 para qualquer rota que nenhum Router tratou. */
function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: "Rota não encontrada" });
}

/**
 * Converte erros em respostas HTTP. Deve ser o ULTIMO middleware do app.
 * Segurança: em erro inesperado devolve mensagem generica ("erro interno") e
 * registra o detalhe so no log do servidor; vazar stack trace ou mensagem do
 * banco ajuda um atacante.
 */
// eslint-disable-next-line no-unused-vars
function tratarErros(erro, req, res, next) {
  if (erro instanceof ErroHttp) return res.status(erro.status).json({ erro: erro.message });

  // JSON malformado no corpo da requisicao (erro do express.json)
  if (erro.type === "entity.parse.failed") return res.status(400).json({ erro: "JSON inválido" });
  if (erro.type === "entity.too.large") return res.status(413).json({ erro: "Corpo da requisição grande demais" });

  // Restricoes do banco: rede de seguranca caso a regra nao tenha sido checada antes no servico.
  if (erro.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ erro: "Registro duplicado" });
  if (erro.code === "SQLITE_CONSTRAINT_FOREIGNKEY") return res.status(409).json({ erro: "Operação viola um vínculo entre registros" });

  console.error(erro);
  res.status(500).json({ erro: "erro interno" });
}

module.exports = { rotaNaoEncontrada, tratarErros };
