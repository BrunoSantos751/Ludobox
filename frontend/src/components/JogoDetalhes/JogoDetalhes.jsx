import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import pfp from "../../assets/images/imagem-perfil.jpg"; 
import './JogoDetalhes.css';

export default function JogoDetalhes({ isLoggedIn, userId }) {
  const { id } = useParams();
  const [dados, setDados] = useState(null);
  const [likedEvaluations, setLikedEvaluations] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/games/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Erro na resposta do servidor");
        return res.json();
      })
      .then(data => {
        setDados(data);
        if (isLoggedIn && userId) {
          fetchUserLikes();
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar detalhes do jogo:", err);
        setLoading(false);
      });
  }, [id, isLoggedIn, userId]);

  const fetchUserLikes = () => {
    fetch(`${API_BASE_URL}/api/user_likes`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setLikedEvaluations(new Set(data.map(item => item.avaliacao_id)));
      })
      .catch(err => console.error("Erro ao carregar likes:", err));
  };

  const handleLike = (avaliacao_id) => {
    if (!isLoggedIn) return;

    const isCurrentlyLiked = likedEvaluations.has(avaliacao_id);
    
    fetch(`${API_BASE_URL}/avaliacoes/toggle_like`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avaliacao_id })
    })
    .then(res => res.json())
    .then(() => {
      setLikedEvaluations(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) newSet.delete(avaliacao_id);
        else newSet.add(avaliacao_id);
        return newSet;
      });
      
      setDados(prev => ({
        ...prev,
        reviews: prev.reviews.map(rev => 
          rev.avaliacao_id === avaliacao_id 
            ? { ...rev, likes: isCurrentlyLiked ? (rev.likes - 1) : (rev.likes + 1) }
            : rev
        )
      }));
    });
  };

  if (loading) return <div className="loading" style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Carregando...</div>;
  if (!dados || !dados.details) return <div className="error" style={{color: 'white', textAlign: 'center'}}>Jogo não encontrado.</div>;

  return (
    <div className="game-details-container">
      <div className="game-header">
        <img src={dados.details.background_image} alt={dados.details.name} />
        
        <div className="game-header-info">
          <h1>{dados.details.name}</h1>
          
          <div className="genres-list">
            {Array.isArray(dados.details.genres) && dados.details.genres.map((g, i) => (
              <span key={`${g}-${i}`} className="genre-tag">
                {typeof g === 'object' ? g.name : g}
              </span>
            ))}
          </div>
            <p><strong>Lançamento:</strong> <br/> {dados.details.released}</p>
              <div className="ratings-container" style={{ display: 'flex', gap: '20px' }}>
                <p><strong>Avaliação RAWG:</strong> <br/> ⭐ {dados.details.rating?.toFixed(1)}</p>
                <p><strong>Comunidade:</strong> <br/> 
                  {dados.community_rating > 0 ? (
                    <>⭐ {dados.community_rating}</>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Sem notas</span>
                  )}
                </p>
              </div>
            </div>
      </div>
      
      <div className="description">
        <h3>Sobre o jogo</h3>
       <div dangerouslySetInnerHTML={{ __html: dados.details.description || "Sem descrição disponível." }} />
      </div>

      <div className="reviews-section">
        <br/>
        <h3>Avaliações da Comunidade</h3>
        {dados.reviews && dados.reviews.length > 0 ? (
          dados.reviews.map(rev => {
            const isLiked = likedEvaluations.has(rev.avaliacao_id);
            const avatarSrc = rev.avatar_url || pfp; 
            return (
              <div key={rev.id || rev.avaliacao_id} className="review-card">
                <div className="review-user-info">
                  <Link to={`/perfil?id=${rev.user_id}`}>
                    <img src={avatarSrc} alt={rev.user_nome} className="review-avatar" />
                  </Link>
                  <div className="review-text-content">
                    <p className="review-author"><strong>{rev.user_nome}</strong> avaliou:</p>
                    <span className="review-rating">⭐ {rev.nota}</span>
                    <p className="review-comment">{rev.comentario}</p>
                  </div>
                </div>

                <div className="review-actions">
                  <button 
                    onClick={() => handleLike(rev.avaliacao_id)}
                    className={`like-btn ${isLiked ? 'liked' : ''}`}
                    disabled={!isLoggedIn}
                  >
                    <span className="material-symbols-outlined">favorite</span>
                    <span className="likes-count">{rev.likes || 0} likes</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-reviews">Ainda não existem avaliações para este jogo.</p>
        )}
      </div>
    </div>
  );
}