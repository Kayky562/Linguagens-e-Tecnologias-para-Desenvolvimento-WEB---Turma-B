/**
 * seed.js
 * Camada: dados. Popula o banco com dados de demonstracao.
 *
 * ATENCAO: apaga os dados existentes antes de inserir (uso em desenvolvimento
 * e demonstracao). Os usuarios de teste estao listados no README.
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./dados/conexao");
const { criarEsquema } = require("./esquema");

criarEsquema();

// Ordem importa: filhos (com FK) antes dos pais.
db.exec(`
  DELETE FROM reivindicacao;
  DELETE FROM objeto;
  DELETE FROM usuario;
  DELETE FROM sqlite_sequence;
`);

const inserirUsuario = db.prepare("INSERT INTO usuario (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)");
const inserirObjeto = db.prepare(
  "INSERT INTO objeto (titulo, descricao, local_encontrado, data_encontrado, usuario_id) VALUES (?, ?, ?, ?, ?)"
);
const inserirReiv = db.prepare("INSERT INTO reivindicacao (objeto_id, usuario_id, mensagem) VALUES (?, ?, ?)");

// Senhas de demonstracao (so existem neste seed; nunca use senhas assim em producao).
const usuarios = [
  ["Administrador", "admin@achados.com", "Admin@123", "admin"],
  ["Ana Souza", "ana@achados.com", "Senha@123", "usuario"],
  ["Bruno Lima", "bruno@achados.com", "Senha@123", "usuario"],
];
for (const [nome, email, senha, papel] of usuarios) {
  inserirUsuario.run(nome, email, bcrypt.hashSync(senha, 10), papel);
}

// ids: 1 = admin, 2 = Ana, 3 = Bruno
inserirObjeto.run("Mochila preta", "Mochila com um caderno e um estojo azul dentro", "Biblioteca", "2026-11-10", 2);
inserirObjeto.run("Chaves com chaveiro vermelho", "Três chaves presas em um chaveiro de plástico", "Cantina", "2026-11-12", 2);
inserirObjeto.run("Garrafa térmica azul", "Garrafa de 500 ml com adesivo de gato", "Laboratório 3", "2026-11-15", 3);
inserirObjeto.run("Fone de ouvido branco", "Fone sem fio dentro de um estojo", "Pátio central", "2026-11-18", 3);

inserirReiv.run(1, 3, "A mochila é minha, o caderno tem meu nome na capa.");
inserirReiv.run(3, 2, "Perdi a garrafa na aula de segunda, tem um adesivo de gato.");

console.log("Banco populado. Usuários de teste:");
for (const [, email, senha, papel] of usuarios) console.log(`  ${papel.padEnd(7)} ${email}  /  ${senha}`);
