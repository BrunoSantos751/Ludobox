import './Catalogo.css';
import { useState, useEffect, useRef } from 'react';
import Cards from '../Cards/Cards';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

export default function Catalogo() {
  const [ordenacao, setOrdenacao] = useState('');
  const [generosSelecionados, setGenerosSelecionados] = useState([]);
  const [busca, setBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroSticky, setFiltroSticky] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
const [totalPaginas, setTotalPaginas] = useState(1);

  const filtroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!filtroRef.current) return;
      const offsetTop = filtroRef.current.offsetTop;
      setFiltroSticky(window.scrollY > offsetTop);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const generos = [
    { id: 'action', nome: 'Ação' },
    { id: 'adventure', nome: 'Aventura' },
    { id: 'role-playing-games-rpg', nome: 'RPG' },
    { id: 'sports', nome: 'Esportes' },
    { id: 'indie', nome: 'Indie' },
    { id: 'strategy', nome: 'Estratégia' },
    { id: 'shooter', nome: 'Tiro' },
    { id: 'puzzle', nome: 'Quebra-cabeça' },
    { id: 'racing', nome: 'Corrida' },
    { id: 'platformer', nome: 'Plataforma' },
    { id: 'fighting', nome: 'Luta' },
    { id: 'simulation', nome: 'Simulação' },
    { id: 'casual', nome: 'Casual' },
    { id: 'arcade', nome: 'Arcade' },
    { id: 'family', nome: 'Família' },
    { id: 'massively-multiplayer', nome: 'Multiplayer Massivo' },
    { id: 'card', nome: 'Cartas' },
    { id: 'board-games', nome: 'Jogos de Tabuleiro' },
    { id: 'educational', nome: 'Educacional' }
  ];

  const handleOrdenar = (e) => {
    setOrdenacao(e.target.value);
  };

  const handleGeneroChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setGenerosSelecionados(prev => [...prev, value]);
    } else {
      setGenerosSelecionados(prev => prev.filter(g => g !== value));
    }
  };

  const limparFiltros = () => {
    setOrdenacao('');
    setGenerosSelecionados([]);
    setBusca('');
  };

  const filtro = {};
  if (ordenacao) filtro.ordenar = ordenacao;
  if (generosSelecionados.length) filtro.generos = generosSelecionados;
  if (busca) filtro.busca = busca;

  return (
    <div className='pagina'>
      <div className="pagina-cat">
        <div className="catalogo-header">
          <h2>Todos os nossos jogos</h2>
          <p>Catálogo completo.</p>

          <div className="catalogo-search">
            <button className="btn-hamburguer" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
              ☰ Filtros
            </button>
            <span className="material-symbols-outlined search-icon">
              search
            </span>
            <input
              type="text"
              className="catalogo-input"
              placeholder="Buscar jogo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="catalogo-page">
          <div
            ref={filtroRef}
            className={`filtros-container ${mostrarFiltros ? 'mostrar' : 'esconder'} ${filtroSticky ? 'sticky' : ''}`}
          >
            <div className="filtro-titles">
              <h2 className='filtro-title'>Filtros</h2>
              <button onClick={limparFiltros}>Limpar Filtros</button>
            </div>
            <hr className='filtro-hr' />
            <div className="checkboxes-ordenacao">
              <label>
                <input
                  type="checkbox"
                  value="name"
                  checked={ordenacao === 'name'}
                  onChange={() => setOrdenacao(ordenacao === 'name' ? '' : 'name')}
                />
                A-Z
              </label>
              <label>
                <input
                  type="checkbox"
                  value="-rating"
                  checked={ordenacao === '-rating'}
                  onChange={() => setOrdenacao(ordenacao === '-rating' ? '' : '-rating')}
                />
                Melhor avaliados
              </label>
            </div>
            <hr className="filtro-hr" />
            <div className="checkboxes-generos">
              {generos.map(gen => (
                <label key={gen.id}>
                  <input
                    type="checkbox"
                    value={gen.id}
                    checked={generosSelecionados.includes(gen.id)}
                    onChange={handleGeneroChange}
                  />
                  {gen.nome}
                </label>
              ))}
            </div>
          </div>

          <div className="catalogo-conteudo">
            <ul>
                <Cards 
                    filtro={filtro} 
                    paginaAtual={paginaAtual} 
                    setTotalPaginas={setTotalPaginas} 
                />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
