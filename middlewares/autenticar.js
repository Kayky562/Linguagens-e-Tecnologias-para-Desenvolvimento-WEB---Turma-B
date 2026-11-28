/**
 * middlewares/autenticar.js
 * Camada: middlewares (HTTP). Autenticacao por JWT e autorizacao por papel.
 */

const jwt = require("jsonwebtoken");
const { erroNaoAutenticado, erroProibido } = require("../utils/erros");

/**
 * Exige um token JWT valido no cabecalho "Authorization: Bearer <token>".
 * Se valido, deixa o usuario em req.usuario = { id, papel, nome }.
 * Todo servico recebe o usuario DAQUI (token assinado), nunca do corpo ou da
 * URL, que o cliente poderia forjar.
 *
 * @throws {ErroHttp} 401 se o token faltar, for invalido ou estiver expirado
 */
function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || "";
  const [tipo, token] = cabecalho.split(" ");
  if (tipo !== "Bearer" || !token) return next(erroNaoAutenticado());

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.sub, papel: payload.papel, nome: payload.nome };
    next();
  } catch {
    next(erroNaoAutenticado("Token inválido ou expirado"));
  }
}

/**
 * Fabrica de middleware: libera a rota so para os papeis informados.
 * Deve vir DEPOIS de autenticar.
 *
 * @param {...string} papeis papeis permitidos (ex.: "admin")
 * @returns {Function} middleware Express
 * @throws {ErroHttp} 403 se o papel do usuario nao estiver na lista
 */
function exigirPapel(...papeis) {
  return (req, res, next) => {
    if (!req.usuario || !papeis.includes(req.usuario.papel)) return next(erroProibido());
    next();
  };
}

module.exports = { autenticar, exigirPapel };
