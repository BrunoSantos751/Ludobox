import logo from "../../assets/images/logo-ludobox.png";
import steam from "../../assets/images/steam-entrar.png";
import './Navbar.css';

export default function Navbar({ onEntrarClick }) {
  return (
    <div className="navbar-container">
      <div className="navbar-logo">
        <a href="/"><img src={logo} alt="Logo Ludobox" /></a>
      </div>
      <div className="navbar-links">
        <ul>
          <li><a href="#">Início</a></li>
          <li><a href="#">Catálogo</a></li>
          <li><a href="#">Tendências</a></li>
          <li className="links login-steam">
            <a href="#">
              <img src={steam} alt="Steam" />
              Entrar com a Steam
            </a>
          </li>
          <li className="links login-button">
            <button onClick={onEntrarClick}>Entrar</button>
          </li>
        </ul>
      </div>
    </div>
  );
}
