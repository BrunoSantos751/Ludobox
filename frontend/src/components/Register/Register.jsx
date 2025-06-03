import { useState } from 'react';
import './Register.css';


function Register() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: ''
  });
  
  const [errors, setErrors] = useState({});
  
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Aqui você pode implementar a lógica de cadastro
      console.log('Formulário enviado:', formData);
      alert('Cadastro realizado com sucesso!');
      
      // Limpar o formulário após o envio
      setFormData({
        nome: '',
        email: '',
        senha: ''
      });
    }
  };
  
  return (
    <div className="register-container">
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
          />
          {errors.senha && <span className="error-message">{errors.senha}</span>}
        </div>
        
        <button type="submit" className="register-button">
          Cadastrar
        </button>
      </form>
      
      <p className="login-link">
        Já tem uma conta: <a href="#">Clique aqui</a>
      </p>
    </div>
  );
}

export default Register;
