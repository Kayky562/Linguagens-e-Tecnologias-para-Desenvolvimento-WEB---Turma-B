/**
 * rotas/objetos.js
 * Camada: rotas (HTTP). Nenhum SQL aqui: tudo passa pelos servicos.
 */

const { Router } = require("express");
const objetos = require("../servicos/objetos");
const reivindicacoes = require("../servicos/reivindicacoes");
const { autenticar, exigirPapel } = require("../middlewares/autenticar");
const { inteiroPositivo } = require("../utils/validacao");

const router = Router();

// GET /objetos?busca=&status= -> 200 | 400 (publica)
router.get("/", (req, res) => res.json(objetos.listar(req.query)));

// GET /objetos/:id -> 200 | 400 | 404 (publica)
router.get("/:id", (req, res) => res.json(objetos.buscar(inteiroPositivo(req.params.id, "id"))));

// POST /objetos -> 201 | 400 | 401 [usuario, admin]
router.post("/", autenticar, (req, res) => {
  res.status(201).json(objetos.criar(req.usuario.id, req.body));
});

// PUT /objetos/:id -> 200 | 400 | 401 | 403 | 404 | 409 [dono ou admin]
router.put("/:id", autenticar, (req, res) => {
  res.json(objetos.atualizar(inteiroPositivo(req.params.id, "id"), req.usuario, req.body));
});

// PATCH /objetos/:id/devolucao -> 200 | 401 | 403 | 404 | 409 [dono ou admin]
router.patch("/:id/devolucao", autenticar, (req, res) => {
  res.json(objetos.marcarDevolvido(inteiroPositivo(req.params.id, "id"), req.usuario));
});

// DELETE /objetos/:id -> 204 | 401 | 403 | 404 | 409 [admin]
router.delete("/:id", autenticar, exigirPapel("admin"), (req, res) => {
  objetos.remover(inteiroPositivo(req.params.id, "id"));
  res.status(204).end();
});

// POST /objetos/:id/reivindicacoes -> 201 | 400 | 401 | 404 | 409 [usuario, admin]
router.post("/:id/reivindicacoes", autenticar, (req, res) => {
  const criada = reivindicacoes.criar(inteiroPositivo(req.params.id, "id"), req.usuario, req.body);
  res.status(201).json(criada);
});

// GET /objetos/:id/reivindicacoes -> 200 | 401 | 403 | 404 [dono ou admin]
router.get("/:id/reivindicacoes", autenticar, (req, res) => {
  res.json(reivindicacoes.listarDoObjeto(inteiroPositivo(req.params.id, "id"), req.usuario));
});

module.exports = router;
