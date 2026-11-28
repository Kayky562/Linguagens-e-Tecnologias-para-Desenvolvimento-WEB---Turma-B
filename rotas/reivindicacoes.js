/**
 * rotas/reivindicacoes.js
 * Camada: rotas (HTTP). Consulta de reivindicacoes do usuario logado.
 */

const { Router } = require("express");
const reivindicacoes = require("../servicos/reivindicacoes");
const { autenticar } = require("../middlewares/autenticar");
const { inteiroPositivo } = require("../utils/validacao");

const router = Router();

// GET /reivindicacoes/minhas -> 200 | 401
// (declarada ANTES de /:id, senao "minhas" seria lido como um id)
router.get("/minhas", autenticar, (req, res) => res.json(reivindicacoes.listarMinhas(req.usuario)));

// GET /reivindicacoes/:id -> 200 | 400 | 401 | 403 | 404 [autor, dono do objeto ou admin]
router.get("/:id", autenticar, (req, res) => {
  res.json(reivindicacoes.buscar(inteiroPositivo(req.params.id, "id"), req.usuario));
});

module.exports = router;
