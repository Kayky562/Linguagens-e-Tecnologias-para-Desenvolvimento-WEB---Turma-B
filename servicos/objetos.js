/**
 * servicos/objetos.js
 * Camada: servicos (regras de negocio dos objetos achados).
 *
 * REGRA PRINCIPAL DO SISTEMA: so quem cadastrou o objeto (ou um admin) pode
 * marca-lo como devolvido. Ela e verificada em marcarDevolvido().
 */

const objetos = require("../dados/objetos");
const reivindicacoes = require("../dados/reivindicacoes");
const v = require("../utils/validacao");
const { erroNaoEncontrado, erroProibido, erroConflito, erroValidacao } = require("../utils/erros");

const STATUS_VALIDOS = ["disponivel", "devolvido"];

/**
 * Lista objetos, com filtros opcionais.
 * @param {{busca?: unknown, status?: unknown}} query parametros da URL
 * @returns {Array<object>}
 * @throws {ErroHttp} 400 se o status informado nao existir
 */
function listar(query = {}) {
  const busca = v.textoOpcional(query.busca, "busca", { max: 100 });
  let status = null;
  if (query.status !== undefined && query.status !== "") {
    if (!STATUS_VALIDOS.includes(query.status)) throw erroValidacao("status deve ser disponivel ou devolvido");
    status = query.status;
  }
  return objetos.listar({ busca, status });
}

/**
 * Busca um objeto pelo id.
 * @param {number} id
 * @returns {object}
 * @throws {ErroHttp} 404 se nao existir
 */
function buscar(id) {
  const objeto = objetos.buscarPorId(id);
  if (!objeto) throw erroNaoEncontrado("Objeto não encontrado");
  return objeto;
}

/** Valida e normaliza os campos de um objeto (usado em criar e atualizar). */
function validarCampos(entrada) {
  const d = v.corpo(entrada);
  return {
    titulo: v.texto(d.titulo, "titulo", { min: 3, max: 100 }),
    descricao: v.textoOpcional(d.descricao, "descricao", { max: 500 }),
    local: v.texto(d.local_encontrado, "local_encontrado", { min: 2, max: 120 }),
    data: v.dataPassada(d.data_encontrado, "data_encontrado"),
  };
}

/**
 * Cadastra um objeto achado.
 *
 * Segurança: o dono vem do token (usuarioId), nunca do corpo da requisicao;
 * senao alguem cadastraria objetos em nome de outra pessoa.
 *
 * @param {number} usuarioId id do usuario autenticado
 * @param {object} entrada corpo da requisicao
 * @returns {object} o objeto criado
 * @throws {ErroHttp} 400 se algum campo for invalido
 */
function criar(usuarioId, entrada) {
  const id = objetos.criar({ ...validarCampos(entrada), usuarioId });
  return objetos.buscarPorId(id);
}

/**
 * Atualiza um objeto. So o dono ou um admin pode (protege contra IDOR:
 * trocar o id na URL nao da acesso a objeto alheio).
 *
 * @param {number} id
 * @param {{id:number, papel:string}} usuario usuario autenticado
 * @param {object} entrada corpo da requisicao
 * @returns {object} o objeto atualizado
 * @throws {ErroHttp} 400 campos invalidos; 403 nao e dono nem admin; 404 nao existe;
 *                    409 se o objeto ja foi devolvido
 */
function atualizar(id, usuario, entrada) {
  const objeto = buscar(id);
  if (objeto.usuario_id !== usuario.id && usuario.papel !== "admin") {
    throw erroProibido("Só quem cadastrou o objeto pode editá-lo");
  }
  if (objeto.status === "devolvido") throw erroConflito("Objeto já devolvido não pode ser editado");
  objetos.atualizar(id, validarCampos(entrada));
  return objetos.buscarPorId(id);
}

/**
 * Marca um objeto como devolvido.
 *
 * REGRA DE NEGOCIO 1 (principal): so quem cadastrou o objeto, ou um admin,
 * pode marca-lo como devolvido. Verificada aqui no servidor; esconder o
 * botao na tela nao protege, pois a rota pode ser chamada com curl.
 *
 * @param {number} id
 * @param {{id:number, papel:string}} usuario usuario autenticado
 * @returns {object} o objeto atualizado
 * @throws {ErroHttp} 403 nao e dono nem admin; 404 nao existe; 409 ja devolvido
 */
function marcarDevolvido(id, usuario) {
  const objeto = buscar(id);
  if (objeto.usuario_id !== usuario.id && usuario.papel !== "admin") {
    throw erroProibido("Só quem cadastrou o objeto pode marcá-lo como devolvido");
  }
  if (objeto.status === "devolvido") throw erroConflito("Objeto já foi devolvido");
  objetos.marcarDevolvido(id);
  return objetos.buscarPorId(id);
}

/**
 * Remove um objeto (rota restrita a admin pelo middleware exigirPapel).
 *
 * Decisao de projeto: nao se apaga objeto que ja recebeu reivindicacoes,
 * para nao perder o historico. A FK do banco tambem impediria; checamos antes
 * para devolver uma mensagem clara.
 *
 * @param {number} id
 * @throws {ErroHttp} 404 nao existe; 409 se houver reivindicacoes
 */
function remover(id) {
  buscar(id);
  if (reivindicacoes.contarPorObjeto(id) > 0) {
    throw erroConflito("Não é possível remover um objeto que já recebeu reivindicações");
  }
  objetos.remover(id);
}

module.exports = { listar, buscar, criar, atualizar, marcarDevolvido, remover };
