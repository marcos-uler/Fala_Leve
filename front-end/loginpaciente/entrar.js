const API  = "/pacientes/login";
const HOME = "../index.html";

const form        = document.getElementById('form-login');
const emailInput  = document.getElementById('email_paciente');
const senhaInput  = document.getElementById('senha');
const toggleSenha = document.getElementById('toggleSenha');
const msgStatus   = document.getElementById('msg-status');

// ─── Olhinho ─────────────────────────────────────────────────
toggleSenha.addEventListener('click', function () {
  const mostrar = senhaInput.type === 'password';
  senhaInput.type = mostrar ? 'text' : 'password';
  toggleSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  toggleSenha.setAttribute('aria-pressed', String(mostrar));
  toggleSenha.querySelector('i').className = mostrar ? 'ti ti-eye-off' : 'ti ti-eye';
});

function mostrarStatus(texto, erro = true) {
  msgStatus.textContent = texto;
  msgStatus.style.color = erro ? '#c0392b' : '#34785e';
}

// ─── Envio ───────────────────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarStatus('');

  const payload = {
    email_paciente: emailInput.value.trim(),
    senha:          senhaInput.value,
  };

  if (!payload.email_paciente || !payload.senha) {
    mostrarStatus('Preencha e-mail e senha.');
    return;
  }

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.status === 200) {
      const dados = await resp.json();
      localStorage.setItem('paciente', JSON.stringify(dados));
      mostrarStatus(`Bem-vindo(a), ${dados.nome_paciente}!`, false);
      setTimeout(() => { window.location.href = HOME; }, 800);
      return;
    }

    let detalhe = 'E-mail ou senha incorretos.';
    try {
      const err = await resp.json();
      if (typeof err.detail === 'string') detalhe = err.detail;
    } catch { /* resposta sem JSON */ }
    mostrarStatus(detalhe);
  } catch {
    mostrarStatus('Falha de conexão com o servidor.');
  }
});