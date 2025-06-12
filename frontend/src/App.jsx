import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './components/Home/Home';
import Register from './components/Register/Register';
import Catalogo from './components/Catalogo/Catalogo';
import Login from './components/Login/Login';
import Navbar from './components/Navbar/Navbar';
import Tendencias from './components/Tendencias/Tendencias';
import Footer from './components/Footer/Footer';
import Perfil from './components/Perfil/Perfil';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const lastKnownAuth = useRef({ isLoggedIn: false, userId: null, userName: '' });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      const params = new URLSearchParams(location.search);
      const authToken = params.get('auth_token');

      if (authToken) {
        console.log("Token de autenticação encontrado na URL. Tentando trocar...");
        try {
          const response = await fetch("https://ludobox.onrender.com/api/exchange_token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: authToken }),
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Troca de token bem-sucedida:", data);
            setIsLoggedIn(data.isLoggedIn);
            setUserName(data.userName);
            setUserId(data.userId);
            lastKnownAuth.current = { isLoggedIn: data.isLoggedIn, userId: data.userId, userName: data.userName };
            navigate(location.pathname, { replace: true });
          } else {
            console.error("Erro na troca de token:", await response.json());
            setIsLoggedIn(false);
            setUserName('');
            setUserId(null);
            lastKnownAuth.current = { isLoggedIn: false, userId: null, userName: '' };
            navigate(location.pathname, { replace: true });
          }
        } catch (error) {
          console.error("Erro de rede ao trocar o token:", error);
          setIsLoggedIn(false);
          setUserName('');
          setUserId(null);
          lastKnownAuth.current = { isLoggedIn: false, userId: null, userName: '' };
          navigate(location.pathname, { replace: true });
        } finally {
          setIsLoading(false);
        }
      } else {
        // Lógica de verificação de status de autenticação original (para login por email ou sessão existente)
        let attempts = 0;
        const MAX_ATTEMPTS = 5;
        const RETRY_DELAY = 1000;

        const fetchAuthStatus = async () => {
          if (lastKnownAuth.current.isLoggedIn && lastKnownAuth.current.userId) {
            setIsLoggedIn(lastKnownAuth.current.isLoggedIn);
            setUserName(lastKnownAuth.current.userName);
            setUserId(lastKnownAuth.current.userId);
            setIsLoading(false);
            return;
          }

          try {
            console.log(`Verificando status de autenticação (tentativa ${attempts + 1})...`);
            const response = await fetch('https://ludobox.onrender.com/api/auth_status', {
              credentials: 'include'
            });

            if (response.ok) {
              const data = await response.json();
              if (data.isLoggedIn) {
                console.log("Usuário está logado:", data.userName);
                setIsLoggedIn(true);
                setUserName(data.userName);
                setUserId(data.userId);
                lastKnownAuth.current = { isLoggedIn: true, userId: data.userId, userName: data.userName };
              } else {
                console.log("Usuário não está logado.");
                setIsLoggedIn(false);
                setUserName('');
                setUserId(null);
                lastKnownAuth.current = { isLoggedIn: false, userId: null, userName: '' };
              }
            } else {
              console.error("Erro ao verificar status de autenticação:", response.status);
              setIsLoggedIn(false);
              setUserName('');
              setUserId(null);
              lastKnownAuth.current = { isLoggedIn: false, userId: null, userName: '' };
            }
          } catch (error) {
            console.error("Erro de rede ao verificar status de autenticação:", error);
            setIsLoggedIn(false);
            setUserName('');
            setUserId(null);
            lastKnownAuth.current = { isLoggedIn: false, userId: null, userName: '' };

            if (attempts < MAX_ATTEMPTS) {
              attempts++;
              setTimeout(fetchAuthStatus, RETRY_DELAY);
              return;
            }
          }
          setIsLoading(false);
        };

        fetchAuthStatus();
      }
    };

    checkAuthStatus();
  }, [location.search, navigate]);

  const handleLogout = () => {
    fetch("https://ludobox.onrender.com/logout", {
      method: "POST",
      credentials: "include"
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Erro na resposta do logout');
      })
      .then(data => {
        console.log("Logout bem-sucedido:", data.message);
        setIsLoggedIn(false);
        setUserName('');
        setUserId(null);
        lastKnownAuth.current = { isLoggedIn: false, userId: null, userName: '' };
        window.location.reload();
      })
      .catch(error => {
        console.error("Erro ao fazer logout:", error);
      });
  };

  return (
    <BrowserRouter>
      <Navbar isLoggedIn={isLoggedIn} userName={userName} onLogout={handleLogout} />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/register' element={<Register />} />
        <Route path='/catalogo' element={<Catalogo />} />
        <Route path='/login' element={<Login />} />
        <Route path='/tendencias' element={<Tendencias />} />
        <Route path='/perfil' element={<Perfil userId={userId} username={userName} />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;