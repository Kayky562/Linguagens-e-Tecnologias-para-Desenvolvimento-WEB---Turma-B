/**
 * rotas/auth.js
 * Camada: rotas (HTTP). Fina: so recebe a requisicao, chama o servico e responde.
 */

const { Router } = require("express");
const auth = require("../servicos/auth");
const { autenticar } = require("../middlewares/autenticar");
const { limiteDeAutenticacao } = require("../middlewares/limites");

const router = Router();

// POST /auth/registro -> 201 | 400 | 409
router.post("/registro", limiteDeAutenticacao, async (req, res, next) => {
  try {
    res.status(201).json(await auth.registrar(req.body));
  } catch (erro) {
    next(erro);
  }
});

// POST /auth/login -> 200 | 400 | 401 (com limite de tentativas)
router.post("/login", limiteDeAutenticacao, async (req, res, next) => {
  try {
    res.json(await auth.login(req.body));
  } catch (erro) {
    next(erro);
  }
});

// GET /auth/eu -> 200 | 401 (quem sou eu, segundo o token)
router.get("/eu", autenticar, (req, res) => res.json(req.usuario));

module.exports = router;
