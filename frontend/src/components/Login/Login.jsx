import { useState } from 'react';
import './Login.css';

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
        const response = await fetch('https://ludobox.onrender.com/login_email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.senha,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setFormData({ email: '', senha: '' });
          setErrors({});
          window.location.href = "/";
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
