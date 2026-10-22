const API = "/psicologos";

const form       = document.getElementById('form-psicologo');
const cpfInput   = document.getElementById('cpf_psicologo');
const crpInput   = document.getElementById('crp_psicologo');
const senhaInput = document.getElementById('senha');
const msgStatus  = document.getElementById('msg-status');

function formatarCpf(valor) {
  const n = valor.replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3}\.\d{3}\.\d{3})(\d{1,2})$/, '$1-$2');
}
function formatarCrp(valor) {
  const n = valor.replace(/\D/g, '').slice(0, 7);
  return n.replace(/^(\d{2})(\d)/, '$1/$2');
}
cpfInput.addEventListener('input', () => { cpfInput.value = formatarCpf(cpfInput.value); });
crpInput.addEventListener('input', () => { crpInput.value = formatarCrp(crpInput.value); });

function toggleSenha() {
  const icone = document.getElementById('icone-olho');
  senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
  icone.className = senhaInput.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}

senhaInput.addEventListener('input', () => {
  const v = senhaInput.value;
  marcar('req-tamanho',   v.length >= 8);
  marcar('req-maiuscula', /[A-Z]/.test(v));
  marcar('req-especial',  /[!@#$%^&*(),.?":{}|<>_\-]/.test(v));
});
function marcar(id, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('ok', ok);
  el.querySelector('i').className = ok ? 'ti ti-circle-check' : 'ti ti-circle';
}

function mostrarStatus(texto, erro = true) {
  msgStatus.textContent = texto;
  msgStatus.style.color = erro ? '#c0392b' : '#27ae60';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarStatus('');

  const senha = senhaInput.value;
  if (!(senha.length >= 8 && /[A-Z]/.test(senha) && /[!@#$%^&*(),.?":{}|<>_\-]/.test(senha))) {
    mostrarStatus('Senha precisa ter 8+ caracteres, 1 maiúscula e 1 especial.');
    return;
  }

  const payload = {
    nome_psicologo:            document.getElementById('nome_psicologo').value.trim(),
    cpf_psicologo:             cpfInput.value.trim(),
    crp_psicologo:             crpInput.value.trim(),
    data_nascimento_psicologo: document.getElementById('data_nascimento_psicologo').value || null,
    email_psicologo:           document.getElementById('email_psicologo').value.trim(),
    senha:                     senha,
  };

  console.log('POST /psicologos payload:', payload);

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.status === 201) {
      const dados = await resp.json();
      mostrarStatus(`Cadastro criado (ID ${dados.id_psicologo}).`, false);
      form.reset();
      return;
    }

    let detalhe = `Erro ${resp.status}`;
    try {
      const err = await resp.json();
      if (typeof err.detail === 'string') detalhe = err.detail;
      else if (Array.isArray(err.detail)) {
        detalhe = err.detail.map(e => `${(e.loc || []).slice(-1)[0]}: ${e.msg}`).join(' · ');
      }
    } catch {}
    mostrarStatus(detalhe);
    console.warn('Erro do backend:', resp.status, detalhe);
  } catch (e) {
    mostrarStatus('Falha de conexão com o servidor.');
    console.error(e);
  }
});