const formCadastro = document.getElementById("form-cadastro");

if (formCadastro) {
  const cpfInput = document.getElementById("cpf_psicologo");
  const crpInput = document.getElementById("crp_psicologo");
  const senhaInput = document.getElementById("senha");
  const toggleSenha = document.getElementById("btn-olho");
  const mensagemStatus = document.getElementById("msg-status");
  const botaoCadastro = document.getElementById("btn-cadastro");

  function mostrarStatus(texto, erro = true) {
    mensagemStatus.textContent = texto;
    mensagemStatus.style.color = erro ? "#c0392b" : "#34785e";
  }

  function formatarCpf(valor) {
    const digitos = valor.replace(/\D/g, "").slice(0, 11);
    return digitos
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3}\.\d{3}\.\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarCrp(valor) {
    const digitos = valor.replace(/\D/g, "").slice(0, 8);
    return digitos.replace(/^(\d{2})(\d)/, "$1/$2");
  }

  cpfInput.addEventListener("input", () => {
    cpfInput.value = formatarCpf(cpfInput.value);
  });

  crpInput.addEventListener("input", () => {
    crpInput.value = formatarCrp(crpInput.value);
  });

  toggleSenha.addEventListener("click", () => {
    const mostrar = senhaInput.type === "password";
    senhaInput.type = mostrar ? "text" : "password";
    toggleSenha.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    toggleSenha.setAttribute("aria-pressed", String(mostrar));
    document.getElementById("icone-olho").className = mostrar ? "ti ti-eye-off" : "ti ti-eye";
  });

  senhaInput.addEventListener("input", () => {
    const valido = senhaInput.value.length >= 8;
    const requisito = document.getElementById("req-tamanho");
    requisito.classList.toggle("ok", valido);
    requisito.querySelector("i").className = valido ? "ti ti-circle-check" : "ti ti-circle";
  });

  formCadastro.addEventListener("submit", async event => {
    event.preventDefault();
    mostrarStatus("");

    if (!formCadastro.reportValidity()) return;

    const optionalValue = id => document.getElementById(id).value.trim() || null;
    const payload = {
      nome_psicologo: document.getElementById("nome_psicologo").value.trim(),
      cpf_psicologo: cpfInput.value,
      rg_psicologo: optionalValue("rg_psicologo"),
      crp_psicologo: crpInput.value.trim(),
      regiao_psicologo: optionalValue("regiao_psicologo"),
      data_formatura_psicologo: optionalValue("data_formatura_psicologo"),
      email_psicologo: document.getElementById("email_psicologo").value.trim(),
      telefone_psicologo: optionalValue("telefone_psicologo"),
      area_especialidade: optionalValue("area_especialidade"),
      data_nascimento_psicologo: optionalValue("data_nascimento_psicologo"),
      senha: senhaInput.value
    };

    botaoCadastro.disabled = true;
    botaoCadastro.textContent = "Enviando...";

    try {
      const resposta = await fetch("/psicologos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });

      let dados;
      try {
        dados = await resposta.json();
      } catch {
        mostrarStatus("O servidor retornou uma resposta inválida. Tente novamente.");
        return;
      }

      if (!resposta.ok) {
        const erros = Array.isArray(dados.detail)
          ? dados.detail.map(erro => erro.msg).filter(Boolean).join(" ")
          : "";
        mostrarStatus(typeof dados.detail === "string"
          ? dados.detail
          : erros || "Confira os dados informados e tente novamente.");
        return;
      }

      formCadastro.reset();
      document.getElementById("req-tamanho").classList.remove("ok");
      document.getElementById("req-tamanho").querySelector("i").className = "ti ti-circle";
      mostrarStatus("Cadastro realizado. Redirecionando para o login...", false);
      window.setTimeout(() => {
        window.location.href = "login/entrar.html";
      }, 900);
    } catch {
      mostrarStatus("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      botaoCadastro.disabled = false;
      botaoCadastro.textContent = "Criar conta →";
    }
  });
}
