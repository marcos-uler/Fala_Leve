const API = "/pacientes";       // mesmo host → caminho relativo basta

const form         = document.getElementById('form-paciente');
const cpfInput     = document.getElementById('cpf_paciente');
const senhaInput   = document.getElementById('senha');
const toggleSenha  = document.getElementById('toggleSenha');
const msgStatus    = document.getElementById('msg-status');

// ─── Olhinho ─────────────────────────────────────────────────
toggleSenha.addEventListener('click', function () {
  const mostrar = senhaInput.type === 'password';
  senhaInput.type = mostrar ? 'text' : 'password';
  toggleSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  toggleSenha.setAttribute('aria-pressed', String(mostrar));
  toggleSenha.querySelector('i').className = mostrar ? 'ti ti-eye-off' : 'ti ti-eye';
});

// ─── Máscara CPF ─────────────────────────────────────────────
cpfInput.addEventListener('input', function () {
  const digits = this.value.replace(/\D/g, '').slice(0, 11);
  let out = digits;
  if (digits.length > 9)      out = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  else if (digits.length > 6) out = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
  else if (digits.length > 3) out = `${digits.slice(0,3)}.${digits.slice(3)}`;
  this.value = out;
});

// ─── Requisitos de senha em tempo real ───────────────────────
function atualizarRequisitosSenha() {
  const senha = senhaInput.value;
  const regras = [
    { id: 'req-length',    ok: senha.length >= 8 },
    { id: 'req-uppercase', ok: /[A-Z]/.test(senha) },
    { id: 'req-special',   ok: /[^A-Za-z0-9]/.test(senha) },
  ];
  regras.forEach(({ id, ok }) => {
    const el = document.getElementById(id);
    el.classList.toggle('is-valid', ok);
    el.querySelector('i').className = ok ? 'ti ti-circle-check' : 'ti ti-circle';
  });
}
senhaInput.addEventListener('input', atualizarRequisitosSenha);
atualizarRequisitosSenha();

// ─── Helpers de mensagem ─────────────────────────────────────
function mostrarStatus(texto, erro = false) {
  msgStatus.textContent = texto;
  msgStatus.style.color = erro ? '#c0392b' : '#34785e';
}

// ─── Envio ───────────────────────────────────────────────────
form.addEventListener('submit', async function (event) {
  event.preventDefault();
  mostrarStatus('');

  const senha = senhaInput.value;
  const senhaValida =
    senha.length >= 8 && /[A-Z]/.test(senha) && /[^A-Za-z0-9]/.test(senha);
  if (!senhaValida) {
    mostrarStatus('A senha precisa ter 8+ caracteres, uma maiúscula e um caractere especial.', true);
    senhaInput.focus();
    return;
  }

  // Monta o payload com os NOMES DE CAMPO que o backend espera
  const payload = {
    nome_paciente:            document.getElementById('nome_paciente').value.trim(),
    cpf_paciente:             cpfInput.value.trim(),
    data_nascimento_paciente: document.getElementById('data_nascimento_paciente').value || null,
    email_paciente:           document.getElementById('email_paciente').value.trim(),
    senha:                    senha,
  };

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.status === 201) {
      const dados = await resp.json();
      mostrarStatus(`Cadastro criado (ID ${dados.id_paciente}). Bem-vindo(a)!`);
      form.reset();
      atualizarRequisitosSenha();
      return;
    }

    // 409 (duplicado), 422 (validação), 503 (banco), etc.
    let detalhe = 'Não foi possível concluir o cadastro.';
    try {
      const err = await resp.json();
      if (typeof err.detail === 'string') detalhe = err.detail;
      else if (Array.isArray(err.detail) && err.detail.length) {
        detalhe = err.detail.map(e => `${e.loc?.slice(-1)[0] || ''}: ${e.msg}`).join(' · ');
      }
    } catch { /* resposta sem JSON */ }
    mostrarStatus(detalhe, true);
  } catch (e) {
    mostrarStatus('Falha de conexão com o servidor.', true);
  }
});