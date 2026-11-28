
/**
 * app.js
 * Servidor principal do sistema de Achados e Perdidos.
 * Integra Express, rotas, seguranca, banco e interface web.
 */

require("dotenv").config();

const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { criarEsquema } = require("./esquema");
const {
  rotaNaoEncontrada,
  tratarErros,
} = require("./middlewares/erros");

const app = express();

// Evita divulgar a tecnologia do servidor.
app.disable("x-powered-by");

// Adiciona cabecalhos de seguranca.
app.use(helmet());

// Permite somente origens configuradas.
// A interface servida pelo proprio Express usa a mesma origem.
const origensPermitidas = (process.env.ORIGENS_PERMITIDAS || "")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

if (origensPermitidas.length > 0) {
  app.use(cors({ origin: origensPermitidas }));
}

// Recebe JSON e limita o tamanho das requisicoes.
app.use(express.json({ limit: "32kb" }));

// Rota publica para verificar o funcionamento da API.
app.get("/saude", (req, res) => {
  res.status(200).json({
    status: "ok",
    sistema: "Achados e Perdidos",
  });
});

// Rotas organizadas por recurso.
app.use("/auth", require("./rotas/auth"));
app.use("/objetos", require("./rotas/objetos"));
app.use(
  "/reivindicacoes",
  require("./rotas/reivindicacoes")
);
app.use("/relatorios", require("./rotas/relatorios"));

// A interface HTML, CSS e JavaScript ficara em public/.
app.use(express.static(path.join(__dirname, "public")));

// Tratamento centralizado de erros.
app.use(rotaNaoEncontrada);
app.use(tratarErros);

/**
 * Inicializa o banco e o servidor HTTP.
 * Exige uma chave JWT configurada fora do codigo.
 */
function iniciar() {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      "Configure JWT_SECRET no .env com pelo menos 32 caracteres."
    );
  }

  const porta = Number(process.env.PORTA || 3000);

  if (
    !Number.isInteger(porta) ||
    porta < 1 ||
    porta > 65535
  ) {
    throw new Error("PORTA invalida no .env.");
  }

  criarEsquema();

  return app.listen(porta, () => {
    console.log(
      `Achados e Perdidos: http://localhost:${porta}`
    );
  });
}

// Permite importar o Express nos testes sem iniciar o servidor.
if (require.main === module) {
  iniciar();
}

module.exports = app;