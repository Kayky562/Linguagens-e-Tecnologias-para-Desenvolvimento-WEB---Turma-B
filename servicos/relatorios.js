/**
 * servicos/relatorios.js
 * Camada: servicos (monta o resumo exibido ao admin).
 */

const relatorios = require("../dados/relatorios");

/**
 * Resumo geral do sistema: totais por status e objetos mais reivindicados.
 *
 * Os totais vem do banco ja agregados (GROUP BY: o banco foi feito para isso
 * e nao traz todas as linhas pela rede). Aqui so se usa reduce para somar
 * os grupos e transformar a lista em um objeto { disponivel, devolvido }.
 *
 * @returns {{total:number, porStatus:{disponivel:number, devolvido:number}, maisReivindicados:Array<object>}}
 */
function resumo() {
  const porStatus = relatorios
    .contarPorStatus()
    .reduce((acc, linha) => ({ ...acc, [linha.status]: linha.total }), { disponivel: 0, devolvido: 0 });
  const total = Object.values(porStatus).reduce((soma, n) => soma + n, 0);
  return { total, porStatus, maisReivindicados: relatorios.maisReivindicados(5) };
}

module.exports = { resumo };
