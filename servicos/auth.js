/**
 * servicos/auth.js
 * Camada: servicos (regras de negocio de cadastro e login).
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usuarios = require("../dados/usuarios");
const v = require("../utils/validacao");
const { erroNaoAutenticado, erroConflito } = require("../utils/erros");

// Hash "de mentira" comparado quando o e-mail nao existe, para o login levar
// o mesmo tempo nos dois casos (evita descobrir quais e-mails estao cadastrados).
const HASH_FALSO = bcrypt.hashSync("senha-que-nunca-sera-usada", 10);

/**
 * Cadastra um novo usuario comum.
 *
 * Segurança: o papel NUNCA vem do corpo da requisicao. Se viesse, qualquer um
 * se cadastraria como admin ("mass assignment"). Todo cadastro publico e 'usuario'.
 * Segurança: a senha e guardada apenas como hash bcrypt (lento e com sal
 * embutido), nunca em texto puro.
 *
 * @param {{nome:unknown, email:unknown, senha:unknown}} entrada corpo da requisicao
 * @returns {{id:number, nome:string, email:string, papel:string}}
 * @throws {ErroHttp} 400 se algum campo for invalido; 409 se o e-mail ja existe
 */
async function registrar(entrada) {
  const dados = v.corpo(entrada);
  const nome = v.texto(dados.nome, "nome", { min: 2, max: 80 });
  const email = v.email(dados.email);
  const senha = v.senha(dados.senha);

  if (usuarios.buscarPorEmail(email)) throw erroConflito("E-mail já cadastrado");

  const senhaHash = await bcrypt.hash(senha, 10);
  // UNIQUE em usuario.email protege a regra mesmo se dois cadastros simultaneos passarem pela checagem acima.
  const id = usuarios.criar({ nome, email, senhaHash });
  return { id, nome, email, papel: "usuario" };
}

/**
 * Autentica e devolve um token JWT.
 *
 * Segurança: a mensagem de erro e a mesma para e-mail inexistente e senha
 * errada (nao revela qual dos dois falhou).
 *
 * @param {{email:unknown, senha:unknown}} entrada corpo da requisicao
 * @returns {{token:string, usuario:{id:number, nome:string, papel:string}}}
 * @throws {ErroHttp} 400 se os campos forem invalidos; 401 se as credenciais nao conferem
 */
async function login(entrada) {
  const dados = v.corpo(entrada);
  const email = v.email(dados.email);
  const senha = typeof dados.senha === "string" ? dados.senha : "";

  const usuario = usuarios.buscarPorEmail(email);
  const confere = await bcrypt.compare(senha, usuario ? usuario.senha_hash : HASH_FALSO);
  if (!usuario || !confere) throw erroNaoAutenticado("E-mail ou senha incorretos");

  // O token carrega so o necessario (id e papel). O segredo vem do .env.
  const token = jwt.sign({ sub: usuario.id, papel: usuario.papel, nome: usuario.nome }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRA || "2h",
  });
  return { token, usuario: { id: usuario.id, nome: usuario.nome, papel: usuario.papel } };
}

module.exports = { registrar, login };
