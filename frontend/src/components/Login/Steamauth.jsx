import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function SteamAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const status = searchParams.get('login');
    

    if (status) {
      console.log("Steam login bem-sucedido! Token salvo.");
      
      // Redireciona para home
      navigate('/');
    } else {
      console.error("Erro: Status de login Steam não encontrado nos parâmetros URL.");
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div>Autenticando...</div>;
}

export default SteamAuth;