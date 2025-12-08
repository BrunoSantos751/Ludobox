import { useEffect, useState, useRef } from 'react'; // Import useRef
import ReactDOM from "react-dom/client"; // Note: ReactDOM is not used directly in App component, can be removed if not needed elsewhere
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './components/Home/Home';
import Register from './components/Register/Register';
import Catalogo from './components/Catalogo/Catalogo';
import Login from './components/Login/Login';
import Navbar from './components/Navbar/Navbar'; 
import Tendencias from './components/Tendencias/Tendencias';
import Footer from './components/Footer/Footer';
import Perfil from './components/Perfil/Perfil'; 
import SteamAuth from './components/Login/Steamauth';
import { API_BASE_URL } from './config';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Usamos uma ref para armazenar o último estado de autenticação 'válido'
  // Refs persistem entre re-renders sem causar novos re-renders por si só.
  const lastKnownAuth = useRef({ isLoggedIn: false, userId: null, userName: '' });

  // Função para verificar o status de autenticação do backend com re-tentativas e persistência
  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 1; // Número máximo de tentativas de verificar o login
    const RETRY_DELAY = 150; // Atraso entre as tentativas em milissegundos

    const checkAuthStatus = async () => {
      setIsLoading(true); // Ativa o estado de carregamento
      
      while (attempts < MAX_ATTEMPTS) {
        try {
          const token = localStorage.getItem('token');

          const response = await fetch(`${API_BASE_URL}/api/auth_status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          const data = await response.json();
          console.log(`App.jsx - Status de autenticação recebido (Tentativa ${attempts + 1}):`, data); // DEBUG

          if (data.logged_in && data.user_id) {
            // Se o login for bem-sucedido e os dados estiverem completos, atualiza o estado
            setIsLoggedIn(true);
            setUserName(data.user_name);
            setUserId(data.user_id);
            // Armazena este estado como o último conhecido bom
            lastKnownAuth.current = { isLoggedIn: true, userId: data.user_id, userName: data.user_name };
            setIsLoading(false); // Carregamento concluído
            return; // Sai da função, pois já estamos autenticados
          } else {
            // Se não estiver logado ou os dados estiverem incompletos, tenta novamente
            attempts++;
            console.log(`App.jsx - Login não detetado ou dados incompletos. Tentando novamente... Tentativa ${attempts}/${MAX_ATTEMPTS}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY)); // Espera antes da próxima tentativa
          }
        } catch (error) {
          console.error(`App.jsx - Erro ao verificar status de autenticação (Tentativa ${attempts + 1}):`, error);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY)); // Espera também em caso de erro
        }
      }

      // Se o loop terminar (atingiu o número máximo de tentativas ou o login foi inconsistente)
      // e tivermos um último estado de login conhecido, usamos esse estado.
      if (lastKnownAuth.current.isLoggedIn) {
        console.log("App.jsx - Não foi possível obter status consistente, usando último estado conhecido.");
        setIsLoggedIn(lastKnownAuth.current.isLoggedIn);
        setUserName(lastKnownAuth.current.userName);
        setUserId(lastKnownAuth.current.userId);
      } else {
        // Se nunca tivemos um login bem-sucedido, o utilizador realmente não está logado
        console.log("App.jsx - Todas as tentativas de autenticação falharam. Definindo como não logado.");
        setIsLoggedIn(false);
        setUserName('');
        setUserId(null);
      }
      setIsLoading(false); // Carregamento concluído (com ou sem login)
    };

    checkAuthStatus();
  }, []); // O useEffect roda apenas uma vez no montagem do componente

  // Função chamada ao clicar em "Sair"
  function handleLogout() {
    fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include' 
    })
      .then(() => {
        setIsLoggedIn(false);
        setUserName('');
        setUserId(null);
        localStorage.removeItem('token'); // Remove o token do armazenamento local
        localStorage.removeItem('user_id'); // Remove o user_id do armazenamento local
        // Limpa também o estado 'último conhecido bom' ao fazer logout
        lastKnownAuth.current = { isLoggedIn: false, userId: null, userName: '' }; 
        window.location.reload(); // Recarrega a página para garantir a atualização
      })
      .catch(error => {
        console.error("Erro ao fazer logout:", error);
        // Opcional: mostrar uma mensagem de erro ao usuário
      });
  }

  // Se estiver a carregar o status de autenticação, mostra um indicador de carregamento
  /*if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', fontSize: '24px' }}>
        Carregando...
      </div>
    );
  }*/

  // Se o carregamento terminou, renderiza a aplicação principal
  return (
    <BrowserRouter>
      {/* A Navbar recebe os estados de login para exibir os links corretos */}
      <Navbar isLoggedIn={isLoggedIn} userName={userName} userId={userId} onLogout={handleLogout} />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/register' element={<Register />} />
        <Route path='/catalogo' element={<Catalogo />} />
        <Route path='/login' element={<Login />} />
        <Route path='/tendencias' element={<Tendencias />}/>
        <Route path='/perfil' element={<Perfil userId={userId} username={userName} />}/>
        <Route path='/authorize' element={<SteamAuth />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
