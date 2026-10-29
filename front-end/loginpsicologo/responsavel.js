const API            = "/responsaveis";
const API_PAGAMENTOS = "/metodos-pagamento/";

// Usado só se a API de métodos de pagamento não responder.
// ⚠️ Os "id" precisam ser os mesmos da tabela metodo_pagamento no Supabase.
const PAGAMENTOS_PADRAO = [
  { id: 1, nome: 'Pix' },
  { id: 2, nome: 'Cartão de crédito' },
  { id: 3, nome: 'Cartão de débito' },
  { id: 4, nome: 'Dinheiro' },
];

const form         = document.getElementById('form-responsavel');
const cpfInput     = document.getElementById('cpf_responsavel');
const telInput     = document.getElementById('telefone_responsavel');
const cepInput     = document.getElementById('cep_responsavel');
const pagamentoSel = document.getElementById('pagamento_responsavel');
const senhaInput   = document.getElementById('senha');
const msgStatus    = document.getElementById('msg-status');

const val = (id) => document.getElementById(id).value.trim();

// ─── Máscaras ────────────────────────────────────────────────
cpfInput.addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  this.value = v;
});

telInput.addEventListener('input', function () {
  const d = this.value.replace(/\D/g, '').slice(0, 11);
  let out = d;
  if (d.length > 10)     out = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  else if (d.length > 6) out = `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  else if (d.length > 2) out = `(${d.slice(0,2)}) ${d.slice(2)}`;
  else if (d.length > 0) out = `(${d}`;
  this.value = out;
});

cepInput.addEventListener('input', function () {
  const d = this.value.replace(/\D/g, '').slice(0, 8);
  this.value = d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
});

// ─── Preenchimento automático pelo CEP (ViaCEP) ──────────────
cepInput.addEventListener('blur', async function () {
  const cep = this.value.replace(/\D/g, '');
  if (cep.length !== 8) return;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    if (d.erro) return;
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (v && !el.value) el.value = v;       // não sobrescreve o que a pessoa já digitou
    };
    set('estado_responsavel', d.uf);
    set('cidade_responsavel', d.localidade);
    set('bairro_responsavel', d.bairro);
    set('rua_responsavel',    d.logradouro);
  } catch { /* sem internet ou CEP inválido: a pessoa preenche manualmente */ }
});

// ─── Formas de pagamento ─────────────────────────────────────
function preencherPagamentos(lista) {
  lista.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nome;
    pagamentoSel.appendChild(opt);
  });
}

async function carregarPagamentos() {
  try {
    const r = await fetch(API_PAGAMENTOS);
    if (!r.ok) throw new Error();
    const dados = await r.json();
    // aceita { id_metodo_pagamento, nome_metodo_pagamento } ou { id, nome }
    const lista = dados.map(d => ({
      id:   d.id_metodo_pagamento ?? d.id,
      nome: d.nome_metodo_pagamento ?? d.nome ?? d.descricao,
    })).filter(p => p.id != null && p.nome);
    if (!lista.length) throw new Error();
    preencherPagamentos(lista);
  } catch {
    preencherPagamentos(PAGAMENTOS_PADRAO);
  }
}
carregarPagamentos();

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
const REGEX_ESPECIAL = /[!@#$%^&*(),.?":{}|<>_\-]/;

senhaInput.addEventListener('input', function () {
  const v = this.value;
  marcarRequisito('req-tamanho',   v.length >= 8);
  marcarRequisito('req-maiuscula', /[A-Z]/.test(v));
  marcarRequisito('req-especial',  REGEX_ESPECIAL.test(v));
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

  // Campos obrigatórios (o form usa novalidate, então checamos aqui)
  for (const campo of form.querySelectorAll('[required]')) {
    if (!campo.value.trim()) {
      const rotulo = form.querySelector(`label[for="${campo.id}"]`);
      mostrarStatus(`Preencha o campo: ${rotulo ? rotulo.textContent.trim() : 'obrigatório'}.`, true);
      campo.focus();
      return;
    }
  }

  if (cpfInput.value.replace(/\D/g, '').length !== 11) {
    mostrarStatus('CPF incompleto.', true);
    cpfInput.focus();
    return;
  }

  if (cepInput.value.replace(/\D/g, '').length !== 8) {
    mostrarStatus('CEP incompleto.', true);
    cepInput.focus();
    return;
  }

  const tel = telInput.value.replace(/\D/g, '');
  if (tel && tel.length < 10) {
    mostrarStatus('Telefone incompleto.', true);
    telInput.focus();
    return;
  }

  // Validação de senha (visual — a coluna senha_hash ainda não existe em
  // `responsavel`, então NÃO enviamos senha para a API).
  const senha = senhaInput.value;
  if (!(senha.length >= 8 && /[A-Z]/.test(senha) && REGEX_ESPECIAL.test(senha))) {
    mostrarStatus('A senha não atende aos requisitos.', true);
    senhaInput.focus();
    return;
  }

  // Nomes de campo iguais às colunas da tabela responsavel (sem o id, gerado pelo banco)
  const payload = {
    nome_responsavel:            val('nome_responsavel'),
    cpf_responsavel:             cpfInput.value.trim(),
    rg_responsavel:              val('rg_responsavel'),
    id_metodo_pagamento:         parseInt(pagamentoSel.value, 10),
    telefone_responsavel:        telInput.value.trim() || null,
    email_responsavel:           val('email_responsavel'),
    estado_responsavel:          document.getElementById('estado_responsavel').value,
    cidade_responsavel:          val('cidade_responsavel'),
    bairro_responsavel:          val('bairro_responsavel'),
    rua_responsavel:             val('rua_responsavel'),
    endereco_responsavel:        val('endereco_responsavel'),
    cep_responsavel:             cepInput.value.trim(),
    data_nascimento_responsavel: document.getElementById('data_nascimento_responsavel').value || null,
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
      ['req-tamanho', 'req-maiuscula', 'req-especial'].forEach(id => marcarRequisito(id, false));
      setTimeout(() => { window.location.href = 'entrar.html'; }, 1200);
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
