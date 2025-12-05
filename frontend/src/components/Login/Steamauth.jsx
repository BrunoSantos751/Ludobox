import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function SteamAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');


    if (token) {
      localStorage.setItem('token', token);

      console.log("Steam login bem-sucedido! Token salvo.");
      
      // Redireciona para home
      navigate('/');
    } else {
      console.error("Erro: Token não fornecido na URL");
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div>Autenticando...</div>;
}

export default SteamAuth;