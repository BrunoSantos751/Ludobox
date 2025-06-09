import { useState } from 'react';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: ''
  });
  
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');  // Mensagem do backend
  const [loading, setLoading] = useState(false); // Para indicar carregamento
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
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
        const response = await fetch('http://localhost:8080/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.nome,
            email: formData.email,
            password: formData.senha // campo 'password' para backend
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setServerMessage(data.message);  // Sucesso
          setFormData({ nome: '', email: '', senha: '' }); // Limpa formulário
          setErrors({});
        } else {
          setServerMessage(data.message);  // Erro do backend (ex: email já cadastrado)
        }
      } catch (error) {
        setServerMessage('Erro na comunicação com o servidor.');
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <div className="register-container">
      <div className="home">
        <a href="/">Voltar</a>
      </div>
      <div className="logo-container">
        <img src="/logo-completo.png" alt="LUDOBOX" className="logo-completo" />
      </div>
      
      <h2 className="title">Criar conta</h2>
      
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Nome"
            className={errors.nome ? 'input-error' : ''}
            disabled={loading}
          />
          {errors.nome && <span className="error-message">{errors.nome}</span>}
        </div>
        
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
        
        <button type="submit" className="register-button" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
      
      {serverMessage && <p className="server-message">{serverMessage}</p>}
      
      <p className="login-link">
        Já tem uma conta: <a href="#">Clique aqui</a>
      </p>
    </div>
  );
}

export default Register;