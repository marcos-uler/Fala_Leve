const cpfInput = document.getElementById('cpf');
const senhaInput = document.getElementById('senha');
const toggleSenha = document.getElementById('toggleSenha');
const formCadastro = document.getElementById('form-cadastro');
const mensagemStatus = document.getElementById('msg-status');
const botaoCadastro = document.getElementById('btn-cadastro');

toggleSenha.addEventListener('click', function () {
  const mostrarSenha = senhaInput.type === 'password';
  senhaInput.type = mostrarSenha ? 'text' : 'password';
  toggleSenha.setAttribute('aria-label', mostrarSenha ? 'Ocultar senha' : 'Mostrar senha');
  toggleSenha.setAttribute('aria-pressed', String(mostrarSenha));
  toggleSenha.querySelector('i').className = mostrarSenha ? 'ti ti-eye-off' : 'ti ti-eye';
});

cpfInput.addEventListener('input', function () {
  const digits = this.value.replace(/\D/g, '').slice(0, 11);
  let formattedCpf = digits;

  if (digits.length > 9) {
    formattedCpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  } else if (digits.length > 6) {
    formattedCpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  } else if (digits.length > 3) {
    formattedCpf = `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  this.value = formattedCpf;
});

function atualizarRequisitosSenha() {
  const senha = senhaInput.value;
  const requisitos = [
    { elemento: document.getElementById('req-length'), valido: senha.length >= 8 && senha.length <= 16 },
    { elemento: document.getElementById('req-uppercase'), valido: /[A-Z]/.test(senha) },
    { elemento: document.getElementById('req-special'), valido: /[^A-Za-z0-9]/.test(senha) }
  ];

  requisitos.forEach(function (requisito) {
    requisito.elemento.classList.toggle('is-valid', requisito.valido);
    requisito.elemento.querySelector('i').className = requisito.valido
      ? 'ti ti-circle-check'
      : 'ti ti-circle';
  });
}

senhaInput.addEventListener('input', atualizarRequisitosSenha);
atualizarRequisitosSenha();

function mostrarStatus(texto, erro = true) {
  mensagemStatus.textContent = texto;
  mensagemStatus.style.color = erro ? '#c0392b' : '#34785e';
}

formCadastro.addEventListener('submit', async function (event) {
  event.preventDefault();
  mostrarStatus('');

  const nome = document.getElementById('nome').value.trim();
  const cpf = document.getElementById('cpf').value.trim();
  const dataNascimento = document.getElementById('data-nascimento').value;
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const idResponsavel = document.getElementById('id-responsavel').value;

  if (!nome || !cpf || !dataNascimento || !email || !senha) {
    mostrarStatus('Preencha todos os campos.');
    return;
  }

  if (idResponsavel && (!Number.isInteger(Number(idResponsavel)) || Number(idResponsavel) < 1)) {
    mostrarStatus('O ID do responsável deve ser um número inteiro positivo.');
    document.getElementById('id-responsavel').focus();
    return;
  }

  const senhaValida = senha.length >= 8 && senha.length <= 16 && /[A-Z]/.test(senha) && /[^A-Za-z0-9]/.test(senha);
  if (!senhaValida) {
    mostrarStatus('A senha deve ter de 8 a 16 caracteres, pelo menos uma letra maiúscula e um caractere especial.');
    senhaInput.focus();
    return;
  }

  const payload = {
    nome_paciente: nome,
    cpf_paciente: cpf,
    data_nascimento_paciente: dataNascimento,
    data_inicio_tratamento: document.getElementById('data-inicio').value || null,
    pagamento_paciente: document.getElementById('pagamento').value.trim() || null,
    telefone_paciente: document.getElementById('telefone').value.trim() || null,
    email_paciente: email,
    estado_paciente: document.getElementById('estado').value.trim().toUpperCase() || null,
    cidade_paciente: document.getElementById('cidade').value.trim() || null,
    bairro_paciente: document.getElementById('bairro').value.trim() || null,
    rua_paciente: document.getElementById('rua').value.trim() || null,
    endereco_paciente: document.getElementById('endereco').value.trim() || null,
    cep_paciente: document.getElementById('cep').value.replace(/\D/g, '') || null,
    id_responsavel: idResponsavel ? Number(idResponsavel) : null,
    senha,
  };

  botaoCadastro.disabled = true;
  botaoCadastro.textContent = 'Enviando...';

  try {
    const resposta = await fetch('/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let dados;
    try {
      dados = await resposta.json();
    } catch {
      mostrarStatus('O servidor retornou uma resposta inválida. Tente novamente.');
      return;
    }

    if (!resposta.ok) {
      const erros = Array.isArray(dados.detail)
        ? dados.detail.map((erro) => erro.msg).filter(Boolean).join(' ')
        : '';
      const detalhe = typeof dados.detail === 'string'
        ? dados.detail
        : erros || 'Confira os dados informados e tente novamente.';
      mostrarStatus(detalhe);
      return;
    }

    formCadastro.reset();
    atualizarRequisitosSenha();
    mostrarStatus('Cadastro realizado com sucesso. Agora você já pode entrar com seu e-mail e senha.', false);
  } catch {
    mostrarStatus('Não foi possível conectar ao servidor. Tente novamente.');
  } finally {
    botaoCadastro.disabled = false;
    botaoCadastro.textContent = 'Criar conta →';
  }
});