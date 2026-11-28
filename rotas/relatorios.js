/**
 * rotas/relatorios.js
 * Camada: rotas (HTTP). Relatorios restritos ao admin.
 */

const { Router } = require("express");
const relatorios = require("../servicos/relatorios");
const { autenticar, exigirPapel } = require("../middlewares/autenticar");

const router = Router();

// GET /relatorios/resumo -> 200 | 401 | 403 [admin]
router.get("/resumo", autenticar, exigirPapel("admin"), (req, res) => res.json(relatorios.resumo()));

module.exports = router;
