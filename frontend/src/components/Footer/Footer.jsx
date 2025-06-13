import './Footer.css';
import logo from "../../assets/images/logo-ludobox.png";

export default function Footer(){
    return(
        <div className="footer">
            <div className="info">
                <div className="descricao">
                    <a href="/"><img src={logo} alt="Logo Ludobox" /></a>
                    <p>LUDOBOX, explore e compartilhe sua paixão por videogames com a comunidade gamer.</p>
                </div>
                <div className="sobre">
                    <p>Sobre nós:</p>
                    <ul>
                    <li><a href="https://github.com/BrunoSantos751/Ludobox" target="_blank" rel="noopener noreferrer">Sobre o ludobox</a></li>
                    <li><a href="https://github.com/BrunoSantos751/Ludobox" target="_blank" rel="noopener noreferrer">Nosso time</a></li>
                    <li><a href="https://github.com/BrunoSantos751/Ludobox" target="_blank" rel="noopener noreferrer">Suporte</a></li>

                    </ul>
                </div>
                <div className="contato">
                    <h3 className="contato-title">Contatos</h3>
                    <p>+00 00000-0000</p>
                    <p>contatoludobox@gmail.com</p>
                </div>
            </div>
            <hr />
            <div className="copyright">Copyright 2025. All rights reserved</div>
        </div>
    )
}