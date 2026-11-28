/**
 * utils/erros.js
 * Camada: utilitario (usado por servicos, middlewares e rotas).
 *
 * Define o erro de aplicacao com status HTTP embutido. Os servicos lancam
 * ErroHttp; o middleware central (middlewares/erros.js) converte em resposta.
 * Assim as regras de negocio nao conhecem req/res e as rotas nao ficam
 * cheias de try/catch.
 */

class ErroHttp extends Error {
  /**
   * @param {number} status   codigo HTTP da resposta (400, 401, 403, 404, 409...)
   * @param {string} mensagem texto seguro para o cliente (sem detalhes internos)
   */
  constructor(status, mensagem) {
    super(mensagem);
    this.name = "ErroHttp";
    this.status = status;
  }
}

// Atalhos legiveis: lancar erroValidacao("...") diz mais que new ErroHttp(400, "...")
const erroValidacao = (msg) => new ErroHttp(400, msg);
const erroNaoAutenticado = (msg = "Autenticação necessária") => new ErroHttp(401, msg);
const erroProibido = (msg = "Você não tem permissão para isso") => new ErroHttp(403, msg);
const erroNaoEncontrado = (msg = "Não encontrado") => new ErroHttp(404, msg);
const erroConflito = (msg) => new ErroHttp(409, msg);

module.exports = {
  ErroHttp,
  erroValidacao,
  erroNaoAutenticado,
  erroProibido,
  erroNaoEncontrado,
  erroConflito,
};
