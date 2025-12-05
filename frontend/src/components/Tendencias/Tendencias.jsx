import { useEffect, useState } from 'react';
import pfp from "../../assets/images/imagem-perfil.jpg";
import './Tendencias.css';
import { API_BASE_URL } from '../../config';

export default function Tendencias() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [erro, setErro] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [formData, setFormData] = useState({
    nome_jogo: "",
    nota: "",
    comentario: ""
  });

  const [sugestoes, setSugestoes] = useState([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [likedEvaluations, setLikedEvaluations] = useState(new Set()); 
  const [showEvaluationForm, setShowEvaluationForm] = useState(false); // Novo estado para controlar a visibilidade do formulário

  useEffect(() => {
    // Verifica status de login
    fetch(`${API_BASE_URL}/api/auth_status`, {
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.logged_in) {
          setIsLoggedIn(true);
          setUserId(data.user_id);
          setUserName(data.user_name);
        } else {
          setIsLoggedIn(false);
          setUserId(null);
          setUserName("");
        }
      })
      .catch((err) => console.error("Erro ao verificar status de login:", err));

    carregarAvaliacoes();
  }, [userId]); // Dependência adicionada para recarregar avaliações quando o userId mudar

  useEffect(() => {
    // Carrega os likes do usuário quando o userId estiver disponível
    if (userId) {
      fetchUserLikes(userId);
    } else {
      // Limpa os likes se o usuário não estiver logado
      setLikedEvaluations(new Set());
    }
  }, [userId]);

  function fetchUserLikes(currentUserId) {
    fetch(`${API_BASE_URL}/api/user_likes?user_id=${currentUserId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Erro ao carregar likes do usuário.');
        }
        return res.json();
      })
      .then(data => {
        // Certifique-se de que `data` é um array de objetos, e mapeie para obter os IDs.
        setLikedEvaluations(new Set(data.map(item => item.avaliacao_id)));
      })
      .catch(err => {
        console.error("Erro ao carregar likes do usuário:", err);
      });
  }

  function carregarAvaliacoes() {
    fetch(`${API_BASE_URL}/avaliacoes/top`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Erro ao carregar avaliações. Status: ' + res.status);
        }
        return res.json();
      })
      .then(data => {
        console.log("Dados recebidos da API /avaliacoes/top:", data); // DEBUG
        setAvaliacoes(data);
      })
      .catch(err => {
        console.error("Erro ao carregar avaliações:", err);
        setErro("Não foi possível carregar as avaliações. Tente novamente mais tarde.");
      });
  }

  function handleLike(avaliacao_id) {
    console.log("handleLike chamado para avaliacao_id:", avaliacao_id);

    if (!isLoggedIn) {
      console.warn("Usuário não logado, não é possível curtir.");
      return;
    }

    const isCurrentlyLiked = likedEvaluations.has(avaliacao_id);
    const endpoint = `${API_BASE_URL}/avaliacoes/toggle_like`;
    
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ avaliacao_id: avaliacao_id, user_id: userId })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.erro || 'Erro ao curtir/descurtir avaliação');
          });
        }
        return res.json();
      })
      .then(data => {
        console.log(data.mensagem);
        setLikedEvaluations(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.delete(avaliacao_id);
          } else {
            newSet.add(avaliacao_id);
          }
          return newSet;
        });

        setAvaliacoes(prevAvaliacoes => {
          return prevAvaliacoes.map(avaliacao => {
            if (avaliacao.avaliacao_id === avaliacao_id) {
              return {
                ...avaliacao,
                likes: isCurrentlyLiked ? avaliacao.likes - 1 : avaliacao.likes + 1
              };
            }
            return avaliacao;
          });
        });
      })
      .catch(err => {
        console.error("Erro ao curtir/descurtir:", err);
      });
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSugestaoClick = (sugestao) => {
    setFormData({ ...formData, nome_jogo: sugestao.name });
    setShowSugestoes(false);
  };

  const handleNomeJogoChange = async (e) => {
    const termo = e.target.value;
    setFormData({ ...formData, nome_jogo: termo });
    if (termo.length > 2) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/games?search=${encodeURIComponent(termo)}&page_size=5`);
        if (!response.ok) {
          throw new Error('Erro ao buscar sugestões de jogos.');
        }
        const data = await response.json();
        setSugestoes(data.results || []);
        setShowSugestoes(true);
      } catch (error) {
        console.error("Erro na busca de sugestões:", error);
        setSugestoes([]);
        setShowSugestoes(false);
      }
    } else {
      setSugestoes([]);
      setShowSugestoes(false);
    }
  };

  const handleSubmitAvaliacao = async (e) => {
    e.preventDefault();
    if (!userId) {
      console.warn("Você precisa estar logado para fazer uma avaliação.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/avaliacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || "Erro ao criar avaliação.");
      }

      const data = await response.json();
      console.log(data.mensagem);
      console.log("Avaliação criada com sucesso!");
      setFormData({ nome_jogo: "", nota: "", comentario: "" });
      setShowEvaluationForm(false);
      carregarAvaliacoes();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      console.error(`Erro ao enviar avaliação: ${error.message}`);
    }
  };


  return (
    <div className="tendencias-pagina">
      <div className='tendencias-container'>
        <div className="tendencias-titulo">
          <h2>Avaliações em Tendência</h2>
        </div>

        {isLoggedIn && (
          <div className="evaluation-button-container">
            <button
              onClick={() => setShowEvaluationForm(!showEvaluationForm)}
              style={{
                background: "#FA9021",
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              {showEvaluationForm ? 'Esconder Formulário' : 'Deixar Avaliação'}
            </button>
          </div>
        )}

        {isLoggedIn && showEvaluationForm && (
          <div className="form-avaliacao" style={{ marginBottom: '50px' }}>
            <h3>Quer deixar sua avaliação?</h3>
            <form onSubmit={handleSubmitAvaliacao} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Nome do jogo"
                  value={formData.nome_jogo}
                  onChange={handleNomeJogoChange}
                  onBlur={() => setTimeout(() => setShowSugestoes(false), 150)}
                  onFocus={() => {
                    if (sugestoes.length > 0) setShowSugestoes(true);
                  }}
                  required
                />
                {showSugestoes && sugestoes.length > 0 && (
                  <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#2c2c2c',
                    border: '1px solid #555',
                    borderRadius: '5px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {sugestoes.map((jogo) => (
                      <li
                        key={jogo.id}
                        onClick={() => {
                          setFormData({ ...formData, nome_jogo: jogo.name });
                          setShowSugestoes(false);
                        }}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #444',
                          color: 'white'
                        }}
                      >
                        {jogo.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="Nota (0 a 5)"
                value={formData.nota}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                required
              />
              <textarea
                placeholder="Comentário"
                value={formData.comentario}
                onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                required
              ></textarea>
              <button type="submit" style={{ background: "#FA9021", color: "white", padding: "10px", border: "none", borderRadius: "5px" }}>
                Enviar Avaliação
              </button>
            </form>
          </div>
        )}

        {avaliacoes.length === 0 ? (
          <p>Nenhuma avaliação em destaque ainda.</p>
        ) : (
          <div className='tendencias-conteudo'>
            {avaliacoes.map((avaliacao) => {
              // Garante que 'isLiked' está definido no escopo correto para cada avaliação
              const isLiked = likedEvaluations.has(avaliacao.avaliacao_id); 
              const avatarSrc = avaliacao.avatar_url ? avaliacao.avatar_url : pfp;
              return (
                <div className='avaliacao' key={avaliacao.avaliacao_id}>
                  {avaliacao.background_image ? (
                    <img
                      src={avaliacao.background_image}
                      alt={avaliacao.nome_jogo || 'Nome do Jogo Indisponível'}
                    />
                  ) : (
                    // Fallback para quando não há imagem disponível
                    <img
                      src="https://placehold.co/300x280/333333/FFFFFF?text=Sem+Imagem" // Placeholder image
                      alt={avaliacao.nome_jogo || 'Nome do Jogo Indisponível'}
                      style={{ width: '100%', maxWidth: '300px', height: 'auto', maxHeight: '280px', borderRadius: '15px', objectFit: 'cover' }}
                    />
                  )}
                  <div className="tendencias-comentario-container">
                    <div className="tendencias-comentario-pfp">
                      <img src={avatarSrc} alt="Foto de perfil" />
                    </div>
                    <div className="tendencias-comentario-info">
                      <div className="pessoal">
                        <div className="comentario-header">
                          <p>{avaliacao.user_nome} <span className='avaliou'>avaliou</span></p>
                          <h3 className='avaliou'>{avaliacao.nome_jogo || 'Nome do Jogo Indisponível'}</h3>
                          <p><span className='avaliacao-estrela'>⭐</span>{avaliacao.nota}</p>
                        </div>
                        <div className="info-pessoal">
                          <p>{avaliacao.comentario}</p>
                        </div>
                      </div>
                      <div className="info-geral">
                        <p className='likes'>
                          <button
                            onClick={() => handleLike(avaliacao.avaliacao_id)}
                            className="like-btn"
                            disabled={!isLoggedIn}
                          >
                            <span
                              className={`material-symbols-outlined ${isLiked ? 'liked-icon' : ''}`}
                              style={isLiked ? { color: '#FA8305' } : { color: 'white' }} // Estilo inline para mudar a cor
                            >
                              favorite
                            </span>
                          </button>
                          {avaliacao.likes} likes
                        </p>
                        {/* Usando avaliacao.rating e avaliacao.metacritic diretamente */}
                        {avaliacao.rating != null && !isNaN(parseFloat(avaliacao.rating)) && (
                          <>
                            <p>Nota geral {parseFloat(avaliacao.rating).toFixed(1)} / 5</p>
                            {avaliacao.metacritic != null && <p>Metacritic: {avaliacao.metacritic}</p>}
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
