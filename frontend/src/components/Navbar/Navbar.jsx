// Navbar.jsx (versão final que recebe props)
import { useState } from "react";
import logo from "../../assets/images/logo-ludobox.png";
import steam from "../../assets/images/steam-entrar.png";
import './Navbar.css';

// Recebe props do App.jsx
export default function Navbar({ isLoggedIn, userName, onLogout }) {
  const [click, setClick] = useState(false);

  // Função para lidar com o clique no botão "Sair"
  const handleLogoutClick = (e) => {
    e.preventDefault(); // Impede o comportamento padrão do link
    onLogout(); // Chama a função onLogout passada via props
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
                <a href="http://localhost:8080/login" onClick={closeMobileMenu} className="nav-links-mobile login-steam">
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