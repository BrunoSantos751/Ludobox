import { useEffect, useState } from 'react';
import pfp from "../../assets/images/imagem-perfil.jpg";
import './Tendencias.css';

export default function Tendencias() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [jogos, setJogos] = useState({});
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8080/avaliacoes/top')
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao buscar as avaliações');
        return res.json();
      })
      .then((data) => {
        setAvaliacoes(data);

        data.forEach((a) => {
          fetch(`http://127.0.0.1:8080/api/games?search=${encodeURIComponent(a.nome_jogo)}&page_size=1`)
            .then((res) => res.json())
            .then((jogoData) => {
              if (jogoData.results && jogoData.results.length > 0) {
                setJogos((prev) => ({
                  ...prev,
                  [a.nome_jogo]: jogoData.results[0],
                }));
              }
            })
            .catch((err) => console.error(`Erro ao buscar jogo ${a.nome_jogo}:`, err));
        });
      })
      .catch((err) => {
        console.error(err);
        setErro('Erro ao carregar avaliações em destaque');
      });
  }, []);

  if (erro) return <p>{erro}</p>;

  return (
    <div className="tendencias-pagina">
        <div className='tendencias-container'>
          <div className="tendencias-titulo">
              <h2>Avaliações em Tendência</h2>
          </div>
          {avaliacoes.length === 0 ? (
            <p>Nenhuma avaliação em destaque ainda.</p>
          ) : (
            <div className='tendencias-conteudo'>
              {avaliacoes.map((avaliacao) => {
                const jogo = jogos[avaliacao.nome_jogo];
                return (
                  <div className='avaliacao' key={avaliacao.id}>
                    {jogo ? (
                      <img
                        src={jogo.background_image}
                        alt={jogo.name}
                      />
                    ) : (
                      <div>
                        Carregando imagem...
                      </div>
                    )}
                    <div className="tendencias-comentario-container">
                        <div className="tendencias-comentario-pfp">
                            <img src={pfp} alt="Foto de perfil" />
                        </div>
                        <div className="tendencias-comentario-info">
                            <div className="pessoal">
                                <div className="comentario-header">
                                    <p>{avaliacao.user_nome} <span className='avaliou'>avaliou</span></p>
                                    <h3 className='game-title'>{avaliacao.nome_jogo}</h3>
                                    <p><span className='avaliacao-estrela'>⭐</span>{avaliacao.nota}</p>
                                </div>
                                <div className="info-pessoal">
                                    <p>{avaliacao.comentario}</p>
                                </div>      
                            </div>
                            <div className="info-geral">
                                <p className='likes'><span class="material-symbols-outlined">
                                    favorite
                                </span> {avaliacao.likes} likes</p>
                                {jogo && (
                                  <>
                                    <p>Nota geral {jogo.rating.toFixed(1)} / 5</p>
                                    {jogo.metacritic && <p>Metacritic: {jogo.metacritic}</p>}
                                  </>
                                )}
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
