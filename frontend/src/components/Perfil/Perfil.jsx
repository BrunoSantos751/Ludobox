import React, { useEffect, useState } from 'react';
import './Perfil.css';
import defaultAvatar from "../../assets/images/imagem-perfil.jpg";

function Profile() {
  const [userGamesByStatus, setUserGamesByStatus] = useState({
    jogando: [],
    zerado: [], // Ou 'concluido'
    abandonado: []
  });
  const [recentReviews, setRecentReviews] = useState([]);
  
  // Dados do usuário (mockados por enquanto, podem vir do backend depois)
  const [userData, setUserData] = useState({
    username: 'FabãoGameplay', // Ex: user.user_name da sessão
    bio: 'Meu nome é Fábio, gosto de jogar uns jogos e me divertir bastante.',
    stats: {
      posts: 0, // Será atualizado dinamicamente
      followers: 0,
      following: 0,
      totalGames: 0,
      completedGames: 0,
      abandonedGames: 0
    }
  });


  useEffect(() => {
    // Buscar ID do usuário via sessão
    fetch('http://127.0.0.1:8080/api/auth_status', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(user => {
        if (user.logged_in && user.user_id) {
          const userId = user.user_id;

          // Se você quiser o nome e a bio do usuário do backend, precisaria de uma rota específica para isso.
          // Por enquanto, mantenho o mock no frontend para username e bio.
          // Atualiza o nome de usuário se vier da sessão (ex: login via Steam/Email)
          setUserData(prev => ({
            ...prev,
            username: user.user_name || prev.username // Usa o nome da sessão se disponível
          }));


          // Buscar jogos por status
          fetch(`http://127.0.0.1:8080/api/users/${userId}/games_by_status`)
            .then(res => res.json())
            .then(data => {
              setUserGamesByStatus({
                jogando: data.jogando || [],
                zerado: data.zerado || [],
                abandonado: data.abandonado || []
              });
              // Atualiza as estatísticas com base nos jogos carregados
              setUserData(prevStats => ({
                ...prevStats,
                stats: {
                  ...prevStats.stats,
                  totalGames: (data.jogando?.length || 0) + (data.zerado?.length || 0) + (data.abandonado?.length || 0),
                  completedGames: data.zerado?.length || 0,
                  abandonedGames: data.abandonado?.length || 0
                }
              }));
            })
            .catch(console.error);

          // Buscar avaliações recentes
          fetch(`http://127.0.0.1:8080/api/users/${userId}/reviews`)
            .then(res => res.json())
            .then(data => setRecentReviews(data))
            .catch(console.error);
        }
      })
      .catch(console.error);
  }, []);

  const renderStars = (rating) => {
    // Arredonda para o número inteiro mais próximo para exibir estrelas cheias
    const roundedRating = Math.round(rating);
    return Array.from({ length: roundedRating }, (_, i) => (
      <span key={i} className="star">★</span>
    ));
  };

  const gameStatusSections = [
    { title: 'JOGANDO', key: 'jogando' },
    { title: 'ZERADOS', key: 'zerado' }, // Ou 'CONCLUÍDOS'
    { title: 'ABANDONADOS', key: 'abandonado' }
  ];

  return (
    <div className="profile-container">
   
      {/* HEADER DO PERFIL */}
      <div className="profile-header">
        <div className="profile-avatar-container">
          <img src={defaultAvatar} alt="Avatar" className="profile-avatar" />
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{userData.username}</h1>
          <div className="profile-stats">
            <div className="stat-item"><span className="stat-value">{userData.stats.posts}</span><span className="stat-label">POSTS</span></div>
            <div className="stat-item"><span className="stat-value">{userData.stats.followers}</span><span className="stat-label">SEGUIDORES</span></div>
            <div className="stat-item"><span className="stat-value">{userData.stats.following}</span><span className="stat-label">SEGUINDO</span></div>
          </div>
          <p className="profile-bio">{userData.bio}</p>
        </div>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="game-stats">
        <div className="game-stat-item"><span className="game-stat-value">{userData.stats.totalGames.toString().padStart(3, '0')}</span><span className="game-stat-label">TOTAL DE JOGOS JOGADOS</span></div>
        <div className="game-stat-item"><span className="game-stat-value">{userData.stats.completedGames.toString().padStart(3, '0')}</span><span className="game-stat-label">JOGOS ZERADO</span></div>
        <div className="game-stat-item"><span className="game-stat-value">{userData.stats.abandonedGames.toString().padStart(3, '0')}</span><span className="game-stat-label">ABANDONADO</span></div>
      </div>

      {/* JOGOS POR STATUS */}
      {gameStatusSections.map(section => (
        <div key={section.key} className="games-by-status-section"> {/* Nova classe para a seção de jogos por status */}
          <h2 className="section-title">{section.title}</h2>
          {userGamesByStatus[section.key] && userGamesByStatus[section.key].length > 0 ? (
            <div className="game-grid"> {/* Nova classe para a grade de jogos */}
              {userGamesByStatus[section.key].map(game => (
                <div key={game.id || game.name} className="game-card"> {/* Fallback key caso o id do jogo falhe */}
                  <img src={game.background_image || defaultAvatar} alt={game.name} className="game-image" /> {/* Fallback image */}
                  <div className="game-title-overlay"> {/* Nova classe para o título */}
                    <h3>{game.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhum jogo nesta categoria.</p>
          )}
        </div>
      ))}

      {/* ÚLTIMAS AVALIAÇÕES */}
      <div className="latest-reviews-section">
        <h2 className="section-title">ÚLTIMAS <span className="highlight">AVALIAÇÕES</span>:</h2>
        <div className="reviews-list">
          {recentReviews.length > 0 ? (
            recentReviews.map(review => (
              <div key={review.id} className="review-item">
                <div className="review-game-image">
                  <img src={review.background_image || defaultAvatar} alt={review.nome_jogo} /> {/* Usa a imagem do jogo da review */}
                </div>
                <div className="review-content">
                  <div className="review-header">
                    <img src={defaultAvatar} alt="Avatar" className="review-avatar" />
                    <span className="review-username">{userData.username}</span>
                    <span className="review-action">avaliou</span>
                    <span className="review-game-name">{review.nome_jogo}</span>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.nota)}
                  </div>
                  <p className="review-comment">{review.comentario}</p>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhuma avaliação recente.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;