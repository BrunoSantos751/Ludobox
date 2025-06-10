// Login.jsx

import { useState } from 'react';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });

  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState(''); // Estado para mensagens do servidor
  const [loading, setLoading] = useState(false); // Estado para indicar carregamento

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerMessage(''); // Limpa mensagens anteriores do servidor

    if (validateForm()) {
      setLoading(true); // Inicia o estado de carregamento

      try {
        const response = await fetch('http://localhost:8080/login_email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.senha, // Enviando como 'password' para o backend
          }),
        });

        const data = await response.json(); // Pega a resposta JSON do servidor

        if (response.ok) { // Verifica se a resposta foi bem-sucedida (status 2xx)
          setServerMessage(data.message);
          // Redirecionar para a dashboard ou página inicial após o login
          window.location.href = '/'; // Redireciona para a página inicial
          console.log('Login bem-sucedido:', data.user);
          setFormData({ email: '', senha: '' }); // Limpa o formulário
          setErrors({}); // Limpa erros de validação
        } else {
          setServerMessage(data.message); // Exibe a mensagem de erro do backend
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
        setServerMessage('Erro ao conectar com o servidor. Tente novamente mais tarde.');
      } finally {
        setLoading(false); // Finaliza o estado de carregamento
      }
    }
  };

  return (
    <div className="login-container">
       <div className="home">
        <a href="/">Voltar</a>
      </div>
      <div className="logo-container">
        <img src="/logo-completo.png" alt="LUDOBOX" className="logo-completo" />
      </div>

      <h2 className="title">Entrar</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Endereço de e-mail"
            className={errors.email ? 'input-error' : ''}
            disabled={loading} // Desabilita input durante o carregamento
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <input
            type="password"
            name="senha"
            value={formData.senha}
            onChange={handleChange}
            placeholder="Senha"
            className={errors.senha ? 'input-error' : ''}
            disabled={loading} // Desabilita input durante o carregamento
          />
          {errors.senha && <span className="error-message">{errors.senha}</span>}
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'} {/* Altera texto do botão */}
        </button>
      </form>

      {serverMessage && <p className="server-message">{serverMessage}</p>} {/* Exibe mensagens do servidor */}

      <p className="forgot-password">
        <a href="#">Esqueceu sua senha?</a>
      </p>

      <p className="register-link">
        Não tem uma conta? <a href="/register">Cadastre-se</a>
      </p>
    </div>
  );
}

export default Login;