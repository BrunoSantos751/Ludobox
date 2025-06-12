import { useEffect, useState } from 'react';
import './Cards.css';

export default function Cards({ filtro, paginaAtual = 1, setTotalPaginas = null, limite = 12 }) {
  const [jogos, setJogos] = useState([]);

  useEffect(() => {
    let url = `https://ludobox.onrender.com/api/games`;
    const params = [`page_size=${limite}`, `page=${paginaAtual}`];

    if (filtro?.ordenar) params.push(`ordering=${filtro.ordenar}`);
    if (filtro?.generos?.length) params.push(`genres=${filtro.generos.join(',')}`);
    if (filtro?.busca) params.push(`search=${encodeURIComponent(filtro.busca)}`);

    url += `?${params.join('&')}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setJogos(data.results || []);
        if (setTotalPaginas && data.count) {
          setTotalPaginas(Math.ceil(data.count / limite));
        }
      })
      .catch(() => setJogos([]));
  }, [filtro, paginaAtual, limite]);

  return (
    <li className="li-card">
      {jogos.map(jogo => (
        <div className="card" key={jogo.id}>
          <div className="jogo-poster">
            <img src={jogo.background_image} alt={jogo.name} />
          </div>
          <div className="jogo-infos">
            <p className="jogo-name">{jogo.name}</p>
            <p className="jogo-nota">
              <span className="star">⭐</span> {jogo.rating.toFixed(1)}
            </p>
          </div>
        </div>
      ))}
    </li>
  );
}
