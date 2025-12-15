import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function SteamAuth() {
  const [searchParams] = useSearchParams();


  useEffect(() => {
    const status = searchParams.get('login');
    
    if (status) {
      console.log("Steam login bem-sucedido! Token salvo.");
      
      // ALTERAÇÃO AQUI: Forçar recarregamento para o App.jsx ler o cookie
      window.location.href = '/'; 
      
    } else {
      console.error("Erro: Status de login Steam não encontrado nos parâmetros URL.");
      // Aqui também é mais seguro forçar o reload ou usar navigate se não houve login
      window.location.href = '/login'; 
    }
  }, [searchParams]); 

  return <div>Autenticando...</div>;
}

export default SteamAuth;