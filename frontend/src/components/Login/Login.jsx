import { useState } from 'react';
import './Login.css';
import { API_BASE_URL } from '../../config';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });

  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
    setServerMessage('');

    if (validateForm()) {
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/login_email`, {
          method: 'POST',
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.senha,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.id || data.user_id) {
            window.location.href = '/'; // Redireciona para a página inicial após o login bem-sucedido
          }
          if (data.user_id) {
            localStorage.setItem('user_id', data.user_id);
          }
          
        } else {
          setServerMessage(data.message);
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
        setServerMessage('Erro ao conectar com o servidor. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
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
            disabled={loading}
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
            disabled={loading}
          />
          {errors.senha && <span className="error-message">{errors.senha}</span>}
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {serverMessage && <p className="server-message">{serverMessage}</p>}

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
