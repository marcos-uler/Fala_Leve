const API = "/pacientes";       // mesmo host → caminho relativo basta

const form         = document.getElementById('form-paciente');
const cpfInput     = document.getElementById('cpf_paciente');
const senhaInput   = document.getElementById('senha');
const toggleSenha  = document.getElementById('toggleSenha');
const msgStatus    = document.getElementById('msg-status');
const telInput     = document.getElementById('telefone_paciente');
const cepInput     = document.getElementById('cep_paciente');

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

// ─── Máscara telefone ────────────────────────────────────────
telInput.addEventListener('input', function () {
  const d = this.value.replace(/\D/g, '').slice(0, 11);
  let out = d;
  if (d.length > 10)     out = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  else if (d.length > 6) out = `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  else if (d.length > 2) out = `(${d.slice(0,2)}) ${d.slice(2)}`;
  else if (d.length > 0) out = `(${d}`;
  this.value = out;
});

// ─── Máscara CEP ─────────────────────────────────────────────
cepInput.addEventListener('input', function () {
  const d = this.value.replace(/\D/g, '').slice(0, 8);
  this.value = d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
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
  const valor = id => document.getElementById(id).value.trim();

  const payload = {
    nome_paciente:            valor('nome_paciente'),
    cpf_paciente:             cpfInput.value.trim(),
    data_nascimento_paciente: valor('data_nascimento_paciente') || null,
    data_inicio_tratamento:   valor('data_inicio_tratamento') || null,
    pagamento_paciente:       Number(valor('pagamento_paciente')) || null,
    telefone_paciente:        telInput.value.trim() || null,
    email_paciente:           valor('email_paciente'),
    estado_paciente:          valor('estado_paciente'),
    cidade_paciente:          valor('cidade_paciente'),
    bairro_paciente:          valor('bairro_paciente'),
    rua_paciente:             valor('rua_paciente'),
    endereco_paciente:        valor('endereco_paciente'),
    cep_paciente:             cepInput.value.trim(),
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
      mostrarStatus('Cadastro criado! Redirecionando para o login...');
      form.reset();
      atualizarRequisitosSenha();
      setTimeout(() => { window.location.href = 'entrar.html'; }, 1200);
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