/**
 * servicos/reivindicacoes.js
 * Camada: servicos (regras de negocio das reivindicacoes).
 */

const db = require("../dados/conexao");
const objetos = require("../dados/objetos");
const reivindicacoes = require("../dados/reivindicacoes");
const v = require("../utils/validacao");
const { erroNaoEncontrado, erroProibido, erroConflito } = require("../utils/erros");

/**
 * Registra a reivindicacao de um objeto pelo usuario autenticado.
 *
 * REGRA DE NEGOCIO 2: so se reivindica objeto DISPONIVEL e que NAO seja o
 * proprio. Alem disso, a mesma pessoa nao reivindica duas vezes: quem garante
 * isso e o UNIQUE (objeto_id, usuario_id) no banco, que vale mesmo com duas
 * requisicoes simultaneas (verificar antes e gravar depois deixaria passar).
 * A verificacao e a gravacao rodam na mesma transacao.
 *
 * @param {number} objetoId objeto reivindicado
 * @param {{id:number}} usuario usuario autenticado (id vem do token, nunca do corpo)
 * @param {object} entrada corpo da requisicao ({ mensagem })
 * @returns {{id:number, objeto_id:number, usuario_id:number, mensagem:string}}
 * @throws {ErroHttp} 400 mensagem invalida; 404 objeto nao existe;
 *                    409 objeto proprio, ja devolvido ou ja reivindicado por voce
 */
function criar(objetoId, usuario, entrada) {
  const mensagem = v.texto(v.corpo(entrada).mensagem, "mensagem", { min: 5, max: 300 });

  const registrar = db.transaction(() => {
    const objeto = objetos.buscarPorId(objetoId);
    if (!objeto) throw erroNaoEncontrado("Objeto não encontrado");
    if (objeto.usuario_id === usuario.id) throw erroConflito("Você não pode reivindicar um objeto que você mesmo cadastrou");
    if (objeto.status !== "disponivel") throw erroConflito("Este objeto já foi devolvido");
    return reivindicacoes.criar({ objetoId, usuarioId: usuario.id, mensagem });
  });

  const id = registrar();
  return { id, objeto_id: objetoId, usuario_id: usuario.id, mensagem };
}

/**
 * Lista as reivindicacoes de um objeto.
 *
 * Segurança (IDOR): so o dono do objeto ou um admin ve quem reivindicou;
 * qualquer outro, mesmo autenticado, recebe 403.
 *
 * @param {number} objetoId
 * @param {{id:number, papel:string}} usuario usuario autenticado
 * @returns {Array<object>}
 * @throws {ErroHttp} 403 se nao for dono nem admin; 404 se o objeto nao existe
 */
function listarDoObjeto(objetoId, usuario) {
  const objeto = objetos.buscarPorId(objetoId);
  if (!objeto) throw erroNaoEncontrado("Objeto não encontrado");
  if (objeto.usuario_id !== usuario.id && usuario.papel !== "admin") {
    throw erroProibido("Só o dono do objeto vê as reivindicações");
  }
  return reivindicacoes.listarPorObjeto(objetoId);
}

/**
 * Lista as reivindicacoes feitas pelo proprio usuario autenticado.
 * Segurança (IDOR): o id vem do token, nao da URL; nao ha como pedir as de outro.
 * @param {{id:number}} usuario
 * @returns {Array<object>}
 */
function listarMinhas(usuario) {
  return reivindicacoes.listarPorUsuario(usuario.id);
}

/**
 * Busca uma reivindicacao pelo id.
 *
 * Segurança (IDOR): trocar o id na URL nao pode revelar a reivindicacao de
 * outra pessoa. Pode ver: o autor, o dono do objeto e o admin.
 *
 * @param {number} id
 * @param {{id:number, papel:string}} usuario usuario autenticado
 * @returns {object}
 * @throws {ErroHttp} 403 se nao tiver relacao com ela; 404 se nao existe
 */
function buscar(id, usuario) {
  const r = reivindicacoes.buscarPorId(id);
  if (!r) throw erroNaoEncontrado("Reivindicação não encontrada");
  const podeVer = r.usuario_id === usuario.id || r.dono_objeto_id === usuario.id || usuario.papel === "admin";
  if (!podeVer) throw erroProibido("Você não tem acesso a esta reivindicação");
  return r;
}

module.exports = { criar, listarDoObjeto, listarMinhas, buscar };
