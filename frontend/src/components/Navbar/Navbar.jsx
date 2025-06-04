import { useState } from "react"
import logo from "../../assets/images/logo-ludobox.png";
import steam from "../../assets/images/steam-entrar.png";
import './Navbar.css';

export default function Navbar({ onEntrarClick }) {
  const [click, setClick] = useState(false);
    


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

          <li className="nav-item login-steam">
            <a href="#" className="nav-links-mobile login-steam"> {/*{onClick={entra com a steam}*/ }
              <img src={steam} alt="Steam" />
              Entrar com a Steam
            </a>
          </li>
          <li className="nav-item" >
            <button className="nav-links-mobile login-button" onClick={onEntrarClick}>Entrar</button>
          </li>
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
