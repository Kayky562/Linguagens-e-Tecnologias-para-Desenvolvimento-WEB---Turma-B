/**
 * middlewares/limites.js
 * Camada: middlewares (HTTP). Limite de requisicoes contra forca bruta.
 */

const rateLimit = require("express-rate-limit");

/**
 * Limita tentativas de login/cadastro por IP. Sem limite, um atacante testaria
 * milhares de senhas por minuto (OWASP A07: falhas de identificacao).
 * O limite e configuravel para os testes automatizados nao serem bloqueados.
 */
const limiteDeAutenticacao = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LIMITE_AUTH) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas. Tente novamente em alguns minutos." },
});

module.exports = { limiteDeAutenticacao };
