const API = "/psicologos";

// A tabela tem a coluna status_psicologo, mas quem se cadastra não escolhe isso.
// Ajuste o valor para o que o seu backend/banco espera (ex.: "pendente", "ativo").
const STATUS_INICIAL = "ativo";

const form       = document.getElementById('form-psicologo');
const cpfInput   = document.getElementById('cpf_psicologo');
const crpInput   = document.getElementById('crp_psicologo');
const telInput   = document.getElementById('telefone_psicologo');
const senhaInput = document.getElementById('senha');
const msgStatus  = document.getElementById('msg-status');

const val = (id) => document.getElementById(id).value.trim();

// ─── Máscaras ────────────────────────────────────────────────
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
function formatarTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length > 10) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length > 6)  return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  if (d.length > 2)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length > 0)  return `(${d}`;
  return d;
}
cpfInput.addEventListener('input', () => { cpfInput.value = formatarCpf(cpfInput.value); });
crpInput.addEventListener('input', () => { crpInput.value = formatarCrp(crpInput.value); });
telInput.addEventListener('input', () => { telInput.value = formatarTelefone(telInput.value); });

// ─── Senha ───────────────────────────────────────────────────
function toggleSenha() {
  const icone = document.getElementById('icone-olho');
  senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
  icone.className = senhaInput.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}

const REGEX_ESPECIAL = /[!@#$%^&*(),.?":{}|<>_\-]/;

senhaInput.addEventListener('input', () => {
  const v = senhaInput.value;
  marcar('req-tamanho',   v.length >= 8);
  marcar('req-maiuscula', /[A-Z]/.test(v));
  marcar('req-especial',  REGEX_ESPECIAL.test(v));
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

// ─── Envio ───────────────────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  mostrarStatus('');

  // Campos obrigatórios (o form usa novalidate, então checamos aqui)
  for (const campo of form.querySelectorAll('[required]')) {
    if (!campo.value.trim()) {
      const rotulo = form.querySelector(`label[for="${campo.id}"]`);
      mostrarStatus(`Preencha o campo: ${rotulo ? rotulo.textContent.trim() : 'obrigatório'}.`);
      campo.focus();
      return;
    }
  }

  if (cpfInput.value.replace(/\D/g, '').length !== 11) {
    mostrarStatus('CPF incompleto.');
    cpfInput.focus();
    return;
  }

  if (crpInput.value.replace(/\D/g, '').length !== 7) {
    mostrarStatus('CRP incompleto (formato 00/00000).');
    crpInput.focus();
    return;
  }

  if (telInput.value.replace(/\D/g, '').length < 10) {
    mostrarStatus('Telefone incompleto.');
    telInput.focus();
    return;
  }

  const formacao = document.getElementById('data_formacao_psicologo').value;
  const hoje = new Date().toISOString().slice(0, 10);
  if (formacao > hoje) {
    mostrarStatus('A data de formação não pode ser no futuro.');
    document.getElementById('data_formacao_psicologo').focus();
    return;
  }

  const senha = senhaInput.value;
  if (!(senha.length >= 8 && /[A-Z]/.test(senha) && REGEX_ESPECIAL.test(senha))) {
    mostrarStatus('Senha precisa ter 8+ caracteres, 1 maiúscula e 1 especial.');
    senhaInput.focus();
    return;
  }

  // Nomes de campo iguais às colunas da tabela psicologo (sem o id, que é gerado pelo banco)
  const payload = {
    nome_psicologo:            val('nome_psicologo'),
    cpf_psicologo:             cpfInput.value.trim(),
    rg_psicologo:              val('rg_psicologo'),
    crp_psicologo:             crpInput.value.trim(),
    regiao_psicologo:          val('regiao_psicologo'),
    status_psicologo:          STATUS_INICIAL,
    data_formacao_psicologo:   formacao || null,
    email_psicologo:           val('email_psicologo'),
    telefone_psicologo:        telInput.value.trim(),
    area_especialidade:        val('area_especialidade'),
    data_nascimento_psicologo: document.getElementById('data_nascimento_psicologo').value || null,
    senha:                     senha,
  };

  console.log('POST /psicologos payload:', { ...payload, senha: '***' });

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
      ['req-tamanho', 'req-maiuscula', 'req-especial'].forEach(id => marcar(id, false));
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