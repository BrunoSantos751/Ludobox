import Navbar from '../Navbar/Navbar';
import Cards from '../Cards/Cards';
import './Home.css';
import Footer from '../Footer/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Conteúdo da homepage */}
        <div className="melhorAvaliados">
          <div className="headermA">
            <h2 className='headermA-title'>Jogos Melhor Avaliados</h2>
            <a href="/catalogo">VER TODOS</a>
          </div>
          <ul className="cards-Ma">
          {/* name → alfabética (A-Z)
          -name → alfabética (Z-A)
          rating → ordem crescente
          -rating → melhor avaliação primeiro
          released → data de lançamento
          Para gêneros, você precisa passar o ID ou slug (por exemplo, action, shooter)*/}
            <Cards filtro={{ ordenar: '-rating' }} limite={5} />

            {/*
            <Cards filtro={{ tipo: "ordenar", valor: "name" }} />     A-Z
            <Cards filtro={{ tipo: "genero", valor: "action,shooter" }} />  gêneros
            // */}
          </ul>
        </div>

        <div className="catalogo">
          <div className="headerCat">
            <h2 className='headerCat-title'>Catálogo</h2>
            <a href="/catalogo">VER TODOS</a>
          </div>
          <ul className="cards-Cat">
          {/* name → alfabética (A-Z)
          -name → alfabética (Z-A)
          rating → ordem crescente
          -rating → melhor avaliação primeiro
          released → data de lançamento
          Para gêneros, você precisa passar o ID ou slug (por exemplo, action, shooter)*/}
            <Cards filtro={{ tipo: "ordenar", valor: "" }} limite={5} />
            {/*
            <Cards filtro={{ tipo: "ordenar", valor: "name" }} />     A-Z
            <Cards filtro={{ tipo: "genero", valor: "action,shooter" }} />  gêneros
            // */}
          </ul>
        </div>
        
        <div className='footer'>
              <Footer />
        </div>
      </main>
    </>
  );
}
