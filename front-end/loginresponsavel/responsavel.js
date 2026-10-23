const API = "/responsaveis";

const form       = document.getElementById('form-responsavel');
const cpfInput   = document.getElementById('cpf_responsavel');
const senhaInput = document.getElementById('senha');
const msgStatus  = document.getElementById('msg-status');

// ─── Máscara CPF ─────────────────────────────────────────────
cpfInput.addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  this.value = v;
});

// ─── Olhinho ─────────────────────────────────────────────────
function toggleSenha() {
  const icone = document.getElementById('icone-olho');
  if (senhaInput.type === 'password') {
    senhaInput.type = 'text';
    icone.className = 'ti ti-eye-off';
  } else {
    senhaInput.type = 'password';
    icone.className = 'ti ti-eye';
  }
}

// ─── Requisitos de senha ─────────────────────────────────────
senhaInput.addEventListener('input', function () {
  const v = this.value;
  marcarRequisito('req-tamanho',   v.length >= 8);
  marcarRequisito('req-maiuscula', /[A-Z]/.test(v));
  marcarRequisito('req-especial',  /[!@#$%^&*(),.?":{}|<>_\-]/.test(v));
});
function marcarRequisito(id, valido) {
  const el = document.getElementById(id);
  const icone = el.querySelector('i');
  el.classList.toggle('ok', valido);
  icone.className = valido ? 'ti ti-circle-check' : 'ti ti-circle';
}

// ─── Status ──────────────────────────────────────────────────
function mostrarStatus(texto, erro = false) {
  msgStatus.textContent = texto;
  msgStatus.style.color = erro ? '#c0392b' : '#27ae60';
}

// ─── Envio ───────────────────────────────────────────────────
form.addEventListener('submit', async function (event) {
  event.preventDefault();
  mostrarStatus('');

  // Validação de senha (visual — a coluna senha_hash ainda não existe em
  // `responsavel`, então NÃO enviamos senha para a API).
  const senha = senhaInput.value;
  if (!(senha.length >= 8 && /[A-Z]/.test(senha) && /[!@#$%^&*(),.?":{}|<>_\-]/.test(senha))) {
    mostrarStatus('A senha não atende aos requisitos.', true);
    senhaInput.focus();
    return;
  }

  const payload = {
    nome_responsavel:            document.getElementById('nome_responsavel').value.trim(),
    cpf_responsavel:             cpfInput.value.trim(),
    email_responsavel:           document.getElementById('email_responsavel').value.trim(),
    data_nascimento_responsavel: document.getElementById('data_nascimento_responsavel').value || null,
    telefone_responsavel:        document.getElementById('telefone_responsavel').value.trim() || null,
    endereco_responsavel:        document.getElementById('endereco_responsavel').value.trim() || null,
  };

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.status === 201) {
      const dados = await resp.json();
      mostrarStatus(`Responsável cadastrado (ID ${dados.id_responsavel}).`);
      form.reset();
      return;
    }

    let detalhe = 'Não foi possível concluir o cadastro.';
    try {
      const err = await resp.json();
      if (typeof err.detail === 'string') detalhe = err.detail;
      else if (Array.isArray(err.detail)) {
        detalhe = err.detail.map(e => `${e.loc?.slice(-1)[0] || ''}: ${e.msg}`).join(' · ');
      }
    } catch { /* sem JSON */ }
    mostrarStatus(detalhe, true);
  } catch {
    mostrarStatus('Falha de conexão com o servidor.', true);
  }
});