const API            = "/pacientes";            // mesmo host → caminho relativo basta
const API_PAGAMENTOS = "/metodos-pagamento";    // ajuste para a rota real da tabela metodo_pagamento

// Usado só se a API de métodos de pagamento não responder.
// ⚠️ Os "id" precisam ser os mesmos da tabela metodo_pagamento no Supabase.
const PAGAMENTOS_PADRAO = [
  { id: 1, nome: 'Pix' },
  { id: 2, nome: 'Cartão de crédito' },
  { id: 3, nome: 'Cartão de débito' },
  { id: 4, nome: 'Dinheiro' },
];

const form          = document.getElementById('form-paciente');
const cpfInput      = document.getElementById('cpf_paciente');
const telInput      = document.getElementById('telefone_paciente');
const cepInput      = document.getElementById('cep_paciente');
const pagamentoSel  = document.getElementById('pagamento_paciente');
const senhaInput    = document.getElementById('senha');
const toggleSenha   = document.getElementById('toggleSenha');
const msgStatus     = document.getElementById('msg-status');

const val = (id) => document.getElementById(id).value.trim();

// ─── Olhinho ─────────────────────────────────────────────────
toggleSenha.addEventListener('click', function () {
  const mostrar = senhaInput.type === 'password';
  senhaInput.type = mostrar ? 'text' : 'password';
  toggleSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  toggleSenha.setAttribute('aria-pressed', String(mostrar));
  toggleSenha.querySelector('i').className = mostrar ? 'ti ti-eye-off' : 'ti ti-eye';
});

// ─── Máscaras ────────────────────────────────────────────────
cpfInput.addEventListener('input', function () {
  const digits = this.value.replace(/\D/g, '').slice(0, 11);
  let out = digits;
  if (digits.length > 9)      out = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  else if (digits.length > 6) out = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
  else if (digits.length > 3) out = `${digits.slice(0,3)}.${digits.slice(3)}`;
  this.value = out;
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
    set('estado_paciente', d.uf);
    set('cidade_paciente', d.localidade);
    set('bairro_paciente', d.bairro);
    set('rua_paciente',    d.logradouro);
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

  // Campos obrigatórios (o form usa novalidate, então checamos aqui)
  for (const campo of form.querySelectorAll('[required]')) {
    if (!campo.value.trim()) {
      const rotulo = form.querySelector(`label[for="${campo.id}"]`);
      const nome = rotulo ? rotulo.childNodes[0].textContent.trim() : 'Campo';
      mostrarStatus(`Preencha o campo: ${nome}.`, true);
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

  const senha = senhaInput.value;
  const senhaValida =
    senha.length >= 8 && /[A-Z]/.test(senha) && /[^A-Za-z0-9]/.test(senha);
  if (!senhaValida) {
    mostrarStatus('A senha precisa ter 8+ caracteres, uma maiúscula e um caractere especial.', true);
    senhaInput.focus();
    return;
  }

  // Monta o payload com os NOMES DE CAMPO que o backend espera (tabela paciente)
  const idResp = val('id_responsavel');
  const payload = {
    id_responsavel:           idResp ? parseInt(idResp, 10) : null,
    nome_paciente:            val('nome_paciente'),
    cpf_paciente:             cpfInput.value.trim(),
    data_nascimento_paciente: document.getElementById('data_nascimento_paciente').value || null,
    data_inicio_tratamento:   document.getElementById('data_inicio_tratamento').value || null,
    pagamento_paciente:       parseInt(pagamentoSel.value, 10),
    telefone_paciente:        telInput.value.trim() || null,
    email_paciente:           val('email_paciente'),
    estado_paciente:          document.getElementById('estado_paciente').value,
    cidade_paciente:          val('cidade_paciente'),
    bairro_paciente:          val('bairro_paciente'),
    rua_paciente:             val('rua_paciente'),
    endereco_paciente:        val('endereco_paciente'),
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