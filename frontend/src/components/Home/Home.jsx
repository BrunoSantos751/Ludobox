import Navbar from '../Navbar/Navbar';
import Cards from '../Cards/Cards';
import './Home.css';

export default function Home({ onEntrarClick }) {
  return (
    <>
      <Navbar onEntrarClick={onEntrarClick} />
      <main>
        {/* Conteúdo da homepage */}
        <div className="melhorAvaliados">
          <div className="headermA">
            <h2 className='headermA-title'>Jogos Melhor Avaliados</h2>
            <a href="/catalogo">VER TODOS</a>
          </div>
          <ul className="cards-Ma">
            <Cards />
          </ul>
        </div>

      </main>
    </>
  );
}
