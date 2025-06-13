// Navbar.jsx (versão final que recebe props)
import { useState } from "react";
import logo from "../../assets/images/logo-ludobox.png";
import steam from "../../assets/images/steam-entrar.png";
import './Navbar.css';

// Recebe props do App.jsx
export default function Navbar({ isLoggedIn, userName, onLogout }) {
  const [click, setClick] = useState(false);

  // Função para lidar com o clique no botão "Sair"
  const handleLogoutClick = async (e) => { // Adicionado 'async' aqui
    e.preventDefault(); // Impede o comportamento padrão do link

    try {
      const response = await fetch("https://ludobox.onrender.com/logout", {
        method: "POST",
        credentials: "include" // Importante para enviar cookies de sessão
      });

      if (response.ok) {
        console.log("Logout realizado com sucesso no backend.");
        onLogout(); // Chama a função onLogout passada via props para atualizar o estado no App.jsx
        // O redirecionamento será feito pelo App.jsx ou pela lógica de rota principal
      } else {
        const errorData = await response.json();
        console.error("Erro ao fazer logout no backend:", errorData.message);
        // Opcional: mostrar uma mensagem de erro para o usuário
      }
    } catch (error) {
      console.error("Erro de rede ao tentar fazer logout:", error);
      // Opcional: mostrar uma mensagem de erro para o usuário
    }
  };

  function handleClick(){
      setClick(!click);
  }

  function closeMobileMenu(){
      setClick(false);
  }

  return (
    <div className="navbar-container">
      <div className="navbar-logo">
        <a href="/" onClick={closeMobileMenu}><img src={logo} alt="Logo Ludobox" /></a>
      </div>

      {/* MENU PARA DISPOSITIVOS MENORES QUE 960px */}
      <div className="navbar-links">
        <ul className={click? "nav-menu active" : "nav-menu"}>
          <li className="nav-item">
            <a href="/" onClick={closeMobileMenu}>Início</a>
          </li>

          <li className="nav-item"><a href="/catalogo" onClick={closeMobileMenu}>Catálogo</a></li>

          <li className="nav-item"><a href="/tendencias" onClick={closeMobileMenu}>Tendências</a></li>

          {isLoggedIn ? (
            <>
              <li className="nav-item login-steam">
                {/* Link para o perfil se logado */}
                <a href="/perfil" onClick={closeMobileMenu} className="nav-links-mobile profile-link">
                  Meu perfil
                </a>
              </li>
              <li className="nav-item" >
                {/* Botão de Sair que chama a função onLogout do App.jsx */}
                <a href="/" onClick={handleLogoutClick} className="nav-links-mobile login-button">Sair</a>
              </li>
            </>
          ) : (
            <>
              {/* Botão de Entrar com Steam se não logado */}
              <li className="nav-item login-steam">
                <a href="https://ludobox.onrender.com/login" onClick={closeMobileMenu} className="nav-links-mobile login-steam">
                  <img src={steam} alt="Steam" />
                  Entrar com a Steam
                </a>
              </li>
              {/* Botão de Entrar (por e-mail) se não logado */}
              <li className="nav-item" >
                <a href="/login" onClick={closeMobileMenu} className="nav-links-mobile login-button">Entrar</a>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="menu-icon" onClick={handleClick}>
          <span className={"material-symbols-outlined"} >
              {click? "close": "menu"}
          </span>
      </div>
    </div>
  );
}
