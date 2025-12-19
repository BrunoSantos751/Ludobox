import Cards from '../Cards/Cards';
import './Home.css';

export default function Home() {
  return (
    <>
      <main>
        {/* Conteúdo da homepage */}
        <div className="melhorAvaliados">
          <div className="headermA">
            <h2 className='headermA-title'>Jogos Melhor Avaliados</h2>
            <a href="/catalogo">VER TODOS</a>
          </div>
          <ul className="cards-Ma">
            <Cards filtro={{ ordenar: '-rating' }} limite={10} />
          </ul>
        </div>

        <div className="catalogo">
          <div className="headerCat">
            <h2 className='headerCat-title'>Catálogo</h2>
            <a href="/catalogo">VER TODOS</a>
          </div>
          <ul className="cards-Cat">
            <Cards filtro={{ tipo: "ordenar", valor: "" }} limite={10} />
          </ul>
        </div>
        
        <div className='footer'>
              
        </div>
      </main>
    </>
  );
}
