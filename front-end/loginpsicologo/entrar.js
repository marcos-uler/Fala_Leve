const API = "/psicologos/login";

const form       = document.getElementById('form-login');
const senhaInput = document.getElementById('senha');
const msgStatus  = document.getElementById('msg-status');

function toggleSenha() {
  const icone = document.getElementById('icone-olho');
  senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
  icone.className = senhaInput.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}

function mostrarStatus(texto, erro = true) {
  msgStatus.textContent = texto;
  msgStatus.style.color = erro ? '#c0392b' : '#27ae60';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarStatus('');

  const payload = {
    email_psicologo: document.getElementById('email_psicologo').value.trim(),
    senha:           senhaInput.value,
  };

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.status === 200) {
      const dados = await resp.json();
      // Guarda os dados do psicólogo logado no navegador
      localStorage.setItem('psicologo', JSON.stringify(dados));
      mostrarStatus(`Bem-vindo(a), ${dados.nome_psicologo}!`, false);
      // Redireciona para o painel (troque pelo caminho real do seu painel)
      setTimeout(() => { window.location.href = '../painel/painel.html'; }, 800);
      return;
    }

    let detalhe = 'E-mail ou senha incorretos.';
    try {
      const err = await resp.json();
      if (typeof err.detail === 'string') detalhe = err.detail;
    } catch {}
    mostrarStatus(detalhe);
  } catch {
    mostrarStatus('Falha de conexão com o servidor.');
  }
});