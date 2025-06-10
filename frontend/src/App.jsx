import { useEffect, useState } from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './components/Home/Home';
import Register from './components/Register/Register';
import Catalogo from './components/Catalogo/Catalogo';
import Login from './components/Login/Login';
import Navbar from './components/Navbar/Navbar'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // Verifica se está logado com a Steam (ou email)
  useEffect(() => {
    fetch('http://localhost:8080/api/auth_status', {
      credentials: 'include' // Importante: envia os cookies de sessão!
    })
      .then(res => res.json())
      .then(data => {
        if (data.logged_in) {
          setIsLoggedIn(true);
          setUserName(data.user_name);
        } else {
          setIsLoggedIn(false);
          setUserName('');
        }
      });
  }, []);

  // Função chamada ao clicar em "Sair"
  function handleLogout() {
    fetch('http://localhost:8080/logout', {
      method: 'GET',
      credentials: 'include' 
    })
      .then(() => {
        setIsLoggedIn(false);
        setUserName('');
        window.location.reload();
      });
  }

  return (
    <BrowserRouter>
      <Navbar isLoggedIn={isLoggedIn} userName={userName} onLogout={handleLogout} />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/register' element={<Register />} />
        <Route path='/catalogo' element={<Catalogo />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
