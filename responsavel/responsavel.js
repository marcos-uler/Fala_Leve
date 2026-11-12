const form = document.getElementById('form-cadastro');
const cpfInput = document.getElementById('cpf');
const senhaInput = document.getElementById('senha');
const mensagemStatus = document.getElementById('msg-status');
const botaoCadastro = document.getElementById('btn-cadastro');

cpfInput.addEventListener('input', function () {
  const digits = this.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 9) this.value = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  else if (digits.length > 6) this.value = digits.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (digits.length > 3) this.value = digits.replace(/(\d{3})(\d{0,3})/, '$1.$2');
});

document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', () => {
    const error = document.getElementById(`erro-${input.id}`);
    if (error) error.style.display = 'none';
    input.style.borderColor = '#FFD0A8';
  });
});

function toggleSenha() {
  const icon = document.getElementById('icone-olho');
  const show = senhaInput.type === 'password';
  senhaInput.type = show ? 'text' : 'password';
  icon.className = show ? 'ti ti-eye-off' : 'ti ti-eye';
  document.getElementById('btn-olho').setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  document.getElementById('btn-olho').setAttribute('aria-pressed', String(show));
}

senhaInput.addEventListener('input', () => {
  const password = senhaInput.value;
  const valid = [
    password.length >= 8 && password.length <= 16,
    /[A-Z]/.test(password),
    /[!@#$%^&*(),.?":{}|<>_\-]/.test(password)
  ];
  ['req-tamanho', 'req-maiuscula', 'req-especial'].forEach((id, index) => {
    const item = document.getElementById(id);
    item.classList.toggle('ok', valid[index]);
    item.querySelector('i').className = valid[index] ? 'ti ti-circle-check' : 'ti ti-circle';
  });
});

function mostrarStatus(texto, erro = true) {
  mensagemStatus.textContent = texto;
  mensagemStatus.style.color = erro ? '#c0392b' : '#27ae60';
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  mostrarStatus('');

  const senha = senhaInput.value;
  if (!form.reportValidity()) return;
  if (cpfInput.value.replace(/\D/g, '').length !== 11) {
    mostrarStatus('Informe um CPF válido.');
    cpfInput.focus();
    return;
  }
  if (senha.length < 8 || senha.length > 16 || !/[A-Z]/.test(senha) || !/[!@#$%^&*(),.?":{}|<>_\-]/.test(senha)) {
    mostrarStatus('A senha deve ter de 8 a 16 caracteres, uma letra maiúscula e um caractere especial.');
    senhaInput.focus();
    return;
  }

  const payload = {
    nome_responsavel: document.getElementById('nome').value.trim(),
    cpf_responsavel: cpfInput.value,
    data_nascimento_responsavel: document.getElementById('data-nascimento').value || null,
    email_responsavel: document.getElementById('email').value.trim(),
    senha
  };
  botaoCadastro.disabled = true;
  botaoCadastro.textContent = 'Enviando...';
  try {
    const response = await fetch('/responsaveis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      mostrarStatus(typeof data.detail === 'string' ? data.detail : 'Confira os dados informados e tente novamente.');
      return;
    }
    form.reset();
    mostrarStatus('Cadastro realizado. Agora entre com seu e-mail e senha.', false);
  } catch {
    mostrarStatus('Não foi possível conectar ao servidor. Tente novamente.');
  } finally {
    botaoCadastro.disabled = false;
    botaoCadastro.textContent = 'Criar conta →';
  }
});
