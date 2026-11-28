
/**
 * public/script.js
 * Camada: front-end.
 * Integra a interface com a API Express usando fetch.
 * Utiliza textContent para exibir dados com segurança.
 */

"use strict";

const obter = (id) => document.getElementById(id);

const sessao = {
  token: null,
  usuario: null
};

/**
 * Faz requisições à API e trata erros HTTP.
 * O token JWT permanece apenas na memória desta página.
 */
async function requisicao(caminho, metodo = "GET", dados) {
  const opcoes = {
    method: metodo,
    headers: {}
  };

  if (dados !== undefined) {
    opcoes.headers["Content-Type"] = "application/json";
    opcoes.body = JSON.stringify(dados);
  }

  if (sessao.token) {
    opcoes.headers.Authorization = `Bearer ${sessao.token}`;
  }

  const resposta = await fetch(caminho, opcoes);

  const resultado = resposta.status === 204
    ? null
    : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(
      resultado?.erro || `Erro HTTP ${resposta.status}`
    );
  }

  return resultado;
}

/** Exibe mensagens de sucesso ou erro. */
function mensagem(id, texto, erro = false) {
  const elemento = obter(id);
  elemento.textContent = texto;
  elemento.style.color = erro ? "#b91c1c" : "#15803d";
}

/** Atualiza o aviso de carregamento e resultados. */
function estadoListagem(texto, tipo = "") {
  const elemento = obter("estado-listagem");

  elemento.textContent = texto;
  elemento.className = "estado-listagem";

  if (tipo) {
    elemento.classList.add(tipo);
  }
}

/** Cria elementos sem inserir HTML fornecido por usuários. */
function elementoTexto(tag, texto, classe = "") {
  const elemento = document.createElement(tag);
  elemento.textContent = texto ?? "";

  if (classe) {
    elemento.className = classe;
  }

  return elemento;
}

/** Atualiza os painéis conforme a autenticação. */
function atualizarInterface(abrirCadastro = false) {
  const autenticado = Boolean(sessao.usuario);

  obter("painel-login").hidden = autenticado || abrirCadastro;
  obter("painel-cadastro").hidden =
    autenticado || !abrirCadastro;

  obter("painel-usuario").hidden = !autenticado;
  obter("painel-novo-objeto").hidden = !autenticado;

  if (autenticado) {
    obter("nome-usuario").textContent = sessao.usuario.nome;
    obter("papel-usuario").textContent =
      `Perfil: ${sessao.usuario.papel}`;
  }
}

/** Consulta os objetos usando os filtros da página. */
async function carregarObjetos() {
  const lista = obter("lista-objetos");

  lista.replaceChildren();
  estadoListagem("Carregando objetos...");

  const busca = obter("campo-busca").value.trim();
  const status = obter("filtro-status").value;

  const parametros = new URLSearchParams();

  if (busca) parametros.set("busca", busca);
  if (status) parametros.set("status", status);

  const consulta = parametros.toString();
  const url = consulta ? `/objetos?${consulta}` : "/objetos";

  try {
    const objetos = await requisicao(url);

    if (!Array.isArray(objetos)) {
      throw new Error("Resposta inesperada do servidor.");
    }

    if (objetos.length === 0) {
      estadoListagem(
        "Nenhum objeto encontrado. Tente outra pesquisa."
      );
      return;
    }

    objetos.forEach((objeto) => {
      lista.appendChild(criarCartao(objeto));
    });

    estadoListagem(
      `${objetos.length} objeto(s) encontrado(s).`,
      "sucesso"
    );
  } catch (erro) {
    lista.replaceChildren();
    estadoListagem(erro.message, "erro");
  }
}

/** Cria um cartão de objeto com ações permitidas. */
function criarCartao(objeto) {
  const cartao = document.createElement("article");
  cartao.className = "cartao-objeto";

  const disponivel = objeto.status === "disponivel";

  cartao.appendChild(
    elementoTexto(
      "span",
      disponivel ? "Disponível" : "Devolvido",
      disponivel
        ? "status status-disponivel"
        : "status status-devolvido"
    )
  );

  cartao.appendChild(
    elementoTexto("h3", objeto.titulo)
  );

  cartao.appendChild(
    elementoTexto(
      "p",
      objeto.descricao || "Sem descrição cadastrada."
    )
  );

  cartao.appendChild(
    elementoTexto(
      "p",
      `Local: ${objeto.local_encontrado}`
    )
  );

  cartao.appendChild(
    elementoTexto(
      "p",
      `Encontrado em: ${objeto.data_encontrado}`
    )
  );

  cartao.appendChild(
    elementoTexto(
      "p",
      `Cadastrado por: ${objeto.cadastrado_por}`
    )
  );

  if (!disponivel) {
    return cartao;
  }

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao botao-primario";

  if (!sessao.usuario) {
    botao.textContent = "Entrar para reivindicar";

    botao.addEventListener("click", () => {
      obter("painel-login").scrollIntoView({
        behavior: "smooth"
      });
      obter("login-email").focus();
    });
  } else {
    const podeGerenciar =
      sessao.usuario.id === objeto.usuario_id ||
      sessao.usuario.papel === "admin";

    if (podeGerenciar) {
      botao.textContent = "Marcar como devolvido";

      botao.addEventListener("click", async () => {
        await marcarDevolvido(objeto.id, botao);
      });
    } else {
      botao.textContent = "Reivindicar objeto";

      botao.addEventListener("click", async () => {
        await reivindicarObjeto(objeto.id, botao);
      });
    }
  }

  cartao.appendChild(botao);

  return cartao;
}

/** Registra uma reivindicação de objeto disponível. */
async function reivindicarObjeto(id, botao) {
  const mensagemReivindicacao = window.prompt(
    "Explique por que este objeto pertence a você:"
  );

  if (mensagemReivindicacao === null) return;

  const texto = mensagemReivindicacao.trim();

  if (texto.length < 5 || texto.length > 300) {
    window.alert(
      "A mensagem deve ter entre 5 e 300 caracteres."
    );
    return;
  }

  botao.disabled = true;

  try {
    await requisicao(
      `/objetos/${id}/reivindicacoes`,
      "POST",
      { mensagem: texto }
    );

    botao.textContent = "Reivindicação enviada";
    window.alert("Reivindicação registrada com sucesso!");
  } catch (erro) {
    window.alert(erro.message);
    botao.disabled = false;
  }
}

/** Confirma a devolução de um objeto. */
async function marcarDevolvido(id, botao) {
  if (!window.confirm(
    "Confirma que este objeto foi devolvido?"
  )) {
    return;
  }

  botao.disabled = true;

  try {
    await requisicao(
      `/objetos/${id}/devolucao`,
      "PATCH"
    );

    await carregarObjetos();
    estadoListagem(
      "Objeto marcado como devolvido com sucesso!",
      "sucesso"
    );
  } catch (erro) {
    window.alert(erro.message);
    botao.disabled = false;
  }
}

/** Realiza login com e-mail e senha. */
obter("form-login").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const botao = obter("botao-login");

  botao.disabled = true;
  botao.textContent = "Entrando...";
  mensagem("mensagem-login", "");

  try {
    const resultado = await requisicao(
      "/auth/login",
      "POST",
      {
        email: obter("login-email").value.trim(),
        senha: obter("login-senha").value
      }
    );

    sessao.token = resultado.token;
    sessao.usuario = resultado.usuario;

    formulario.reset();
    atualizarInterface();
    await carregarObjetos();
  } catch (erro) {
    mensagem("mensagem-login", erro.message, true);
  } finally {
    botao.disabled = false;
    botao.textContent = "Entrar";
  }
});

/** Cadastra uma nova conta com papel de usuário comum. */
obter("form-cadastro").addEventListener(
  "submit",
  async (evento) => {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const botao = formulario.querySelector(
      'button[type="submit"]'
    );

    botao.disabled = true;
    mensagem("mensagem-cadastro", "");

    try {
      const email = obter("cadastro-email").value.trim();

      await requisicao("/auth/registro", "POST", {
        nome: obter("cadastro-nome").value.trim(),
        email,
        senha: obter("cadastro-senha").value
      });

      formulario.reset();
      atualizarInterface(false);
      obter("login-email").value = email;

      mensagem(
        "mensagem-login",
        "Conta criada! Agora faça seu login."
      );
    } catch (erro) {
      mensagem("mensagem-cadastro", erro.message, true);
    } finally {
      botao.disabled = false;
    }
  }
);

/** Cadastra um objeto vinculado ao usuário autenticado. */
obter("form-objeto").addEventListener(
  "submit",
  async (evento) => {
    evento.preventDefault();

    const formulario = evento.currentTarget;
    const botao = formulario.querySelector(
      'button[type="submit"]'
    );

    botao.disabled = true;
    mensagem("mensagem-objeto", "");

    try {
      await requisicao("/objetos", "POST", {
        titulo: obter("objeto-titulo").value.trim(),
        descricao: obter("objeto-descricao").value.trim(),
        local_encontrado: obter("objeto-local").value.trim(),
        data_encontrado: obter("objeto-data").value
      });

      formulario.reset();

      mensagem(
        "mensagem-objeto",
        "Objeto cadastrado com sucesso!"
      );

      await carregarObjetos();
    } catch (erro) {
      mensagem("mensagem-objeto", erro.message, true);
    } finally {
      botao.disabled = false;
    }
  }
);

/** Aplica os filtros escolhidos. */
obter("form-busca").addEventListener("submit", (evento) => {
  evento.preventDefault();
  carregarObjetos();
});

/** Alterna entre login e cadastro. */
obter("mostrar-cadastro").addEventListener("click", () => {
  atualizarInterface(true);
});

obter("voltar-login").addEventListener("click", () => {
  atualizarInterface(false);
});

/** Encerra a sessão atual. */
obter("botao-sair").addEventListener("click", () => {
  sessao.token = null;
  sessao.usuario = null;

  atualizarInterface(false);
  mensagem("mensagem-login", "Você saiu da sua conta.");
  carregarObjetos();
});

/** Inicializa a página. */
atualizarInterface();
carregarObjetos();