/**
 * utils/validacao.js
 * Camada: utilitario (usado pelos servicos).
 *
 * Funcoes pequenas que validam tipo, formato e faixa de TODA entrada vinda do
 * usuario antes de ela ser usada. Segurança: a validacao no cliente (tela) e
 * so conforto; quem garante e o servidor, porque o cliente pode ser burlado
 * com curl. Cada funcao devolve o valor ja normalizado ou lanca 400.
 */

const { erroValidacao } = require("./erros");

/**
 * Valida um texto obrigatorio, aparando espacos nas pontas.
 * @param {unknown} valor
 * @param {string} campo nome do campo (aparece na mensagem de erro)
 * @param {{min?: number, max?: number}} [limites]
 * @returns {string} texto aparado
 * @throws {ErroHttp} 400 se nao for texto ou estiver fora da faixa de tamanho
 */
function texto(valor, campo, { min = 1, max = 200 } = {}) {
  if (typeof valor !== "string") throw erroValidacao(`${campo} deve ser um texto`);
  const aparado = valor.trim();
  if (aparado.length < min || aparado.length > max) {
    throw erroValidacao(`${campo} deve ter entre ${min} e ${max} caracteres`);
  }
  return aparado;
}

/**
 * Valida um texto opcional: ausente vira null; se vier, segue as mesmas regras.
 * @returns {string|null}
 */
function textoOpcional(valor, campo, { max = 500 } = {}) {
  if (valor === undefined || valor === null || valor === "") return null;
  return texto(valor, campo, { min: 1, max });
}

/**
 * Valida formato basico de e-mail e normaliza para minusculas.
 * @returns {string}
 * @throws {ErroHttp} 400 se o formato for invalido
 */
function email(valor) {
  const e = texto(valor, "email", { min: 5, max: 120 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw erroValidacao("email inválido");
  return e;
}

/**
 * Valida a senha de cadastro (tamanho minimo e maximo).
 * O maximo de 72 existe porque o bcrypt ignora o que passa de 72 bytes.
 * @returns {string} a senha, sem alterar (nao se apara senha)
 */
function senha(valor) {
  if (typeof valor !== "string" || valor.length < 8 || valor.length > 72) {
    throw erroValidacao("senha deve ter entre 8 e 72 caracteres");
  }
  return valor;
}

/**
 * Converte para inteiro positivo (ids vindos da URL ou do corpo).
 * @param {unknown} valor
 * @param {string} campo
 * @returns {number}
 * @throws {ErroHttp} 400 se nao for inteiro >= 1
 */
function inteiroPositivo(valor, campo) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1) throw erroValidacao(`${campo} deve ser um inteiro positivo`);
  return n;
}

/**
 * Valida data no formato AAAA-MM-DD, que exista no calendario e nao seja futura.
 * @returns {string}
 * @throws {ErroHttp} 400 se invalida ou no futuro
 */
function dataPassada(valor, campo) {
  const s = texto(valor, campo, { min: 10, max: 10 });
  const d = new Date(`${s}T00:00:00Z`);
  const valida = /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
  if (!valida) throw erroValidacao(`${campo} deve estar no formato AAAA-MM-DD`);
  if (d.getTime() > Date.now()) throw erroValidacao(`${campo} não pode ser futura`);
  return s;
}

/**
 * Garante que o corpo da requisicao e um objeto (e nao null, texto ou lista).
 * @returns {object}
 */
function corpo(valor) {
  if (valor === null || typeof valor !== "object" || Array.isArray(valor)) {
    throw erroValidacao("corpo da requisição inválido");
  }
  return valor;
}

module.exports = { texto, textoOpcional, email, senha, inteiroPositivo, dataPassada, corpo };
