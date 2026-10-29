const API  = "/responsaveis/login";
const HOME = "../index.html";

const form       = document.getElementById('form-login');
const emailInput = document.getElementById('email_responsavel');
const senhaInput = document.getElementById('senha');
const msgStatus  = document.getElementById('msg-status');

function toggleSenha() {
  const icone = document.getElementById('icone-olho');
  const mostrar = senhaInput.type === 'password';
  senhaInput.type = mostrar ? 'text' : 'password';
  icone.className = mostrar ? 'ti ti-eye-off' : 'ti ti-eye';
  document.getElementById('btn-olho').setAttribute('aria-pressed', String(mostrar));
}

function mostrarStatus(texto, erro = true) {
  msgStatus.textContent = texto;
  msgStatus.style.color = erro ? '#c0392b' : '#27ae60';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarStatus('');

  const payload = {
    email_responsavel: emailInput.value.trim(),
    senha:             senhaInput.value,
  };

  if (!payload.email_responsavel || !payload.senha) {
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
      localStorage.setItem('responsavel', JSON.stringify(dados));
      mostrarStatus(`Bem-vindo(a), ${dados.nome_responsavel}!`, false);
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
