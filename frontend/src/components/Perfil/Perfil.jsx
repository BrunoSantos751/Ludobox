import React, { useEffect, useState } from 'react';
import './Perfil.css';
import defaultAvatar from "../../assets/images/imagem-perfil.jpg"; // VERIFIQUE ESTE CAMINHO NOVAMENTE
import { FaEdit, FaPlus, FaSearch, FaTimes, FaTrash } from 'react-icons/fa';
import SeguidoresESeguindo from './SeguidoresESeguindo';
import { API_BASE_URL } from '../../config';


function Profile({ userId: loggedInUserId, username: propUsername }) {
  const [userGamesByStatus, setUserGamesByStatus] = useState({
    jogando: [],
    zerado: [],
    abandonado: []
  });
  const [recentReviews, setRecentReviews] = useState([]);

  const [userData, setUserData] = useState({
    userId: loggedInUserId,
    username: propUsername || 'Carregando nome...',
    bio: 'Nenhuma biografia definida.',
    avatar_url: defaultAvatar || '', // Adicionado fallback para string vazia
    stats: {
      posts: 0,
      followers: 0,
      following: 0,
      totalGames: 0,
      completedGames: 0,
      abandonedGames: 0
    }
  });

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');

  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameStatus, setNewGameStatus] = useState('jogando');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  const [showFollowPanel, setShowFollowPanel] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState('buscar');
  const [topSearchTerm, setTopSearchTerm] = useState('');

  const isMyProfile = true;


  const refreshFollowCounts = async () => {
    console.log('Perfil.jsx: refreshFollowCounts disparado');
    if (loggedInUserId) {
      try {
        const followersResponse = await fetch(`${API_BASE_URL}/api/users/${loggedInUserId}/seguidores`);
        if (followersResponse.ok) {
          const data = await followersResponse.json();
          setUserData(prev => ({
            ...prev,
            stats: { ...prev.stats, followers: Array.isArray(data) ? data.length : 0 }
          }));
        } else {
            console.error('Falha ao buscar seguidores no refresh:', followersResponse.status);
        }

        const followingResponse = await fetch(`${API_BASE_URL}/api/users/${loggedInUserId}/seguindo`);
        if (followingResponse.ok) {
          const data = await followingResponse.json();
          setUserData(prev => ({
            ...prev,
            stats: { ...prev.stats, following: Array.isArray(data) ? data.length : 0 }
          }));
        } else {
            console.error('Falha ao buscar quem segue no refresh:', followingResponse.status);
        }
      } catch (error) {
        console.error('Erro ao atualizar contagens de seguidores/seguindo:', error);
      }
    }
  };


  useEffect(() => {
    if (loggedInUserId) {
      console.log('Perfil.jsx - Fetching data for loggedInUserId:', loggedInUserId);

      const fetchUserProfile = async (idToFetch) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/users/${idToFetch}/profile`);
          if (!response.ok) {
            let errorDetails = `Status: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorDetails += ` - ${errorData.message || JSON.stringify(errorData)}`;
            } catch (jsonError) {
                const errorText = await response.text();
                errorDetails += ` - ${errorText}`;
            }
            throw new Error(`Falha ao buscar perfil do utilizador: ${errorDetails}`);
          }
          const data = await response.json();

          // CORREÇÃO: Verifique se 'data' não é null antes de acessar as propriedades
          if (data) {
            setUserData(prev => ({
              ...prev,
              userId: idToFetch,
              username: data.nome || prev.username,
              bio: data.bio || 'Nenhuma biografia definida.',
              avatar_url: data.avatar_url || defaultAvatar || '', // Adicionado fallback
            }));
            setNewBio(data.bio || '');
          } else {
            console.warn('Perfil.jsx: Dados do perfil recebidos como null ou vazios. Usando valores padrão.');
            setUserData(prev => ({
                ...prev,
                userId: idToFetch,
                username: prev.username,
                bio: 'Nenhuma biografia definida.',
                avatar_url: defaultAvatar || '', // Usando o avatar padrão se a API retornar null
            }));
            setNewBio('');
          }
        } catch (error) {
          console.error('Perfil.jsx - Erro ao buscar perfil do utilizador:', error);
          alert(`Erro ao carregar perfil: ${error.message}`); // Alerta o usuário
        }
      };

      const fetchUserGamesByStatus = async (idToFetch) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/users/${idToFetch}/games_by_status`);
          if (!response.ok) {
            throw new Error('Falha ao buscar jogos do utilizador por status');
          }
          const data = await response.json();
          // Certifique-se que data e suas propriedades são arrays
          setUserGamesByStatus({
            jogando: Array.isArray(data.jogando) ? data.jogando : [],
            zerado: Array.isArray(data.zerado) ? data.zerado : [],
            abandonado: Array.isArray(data.abandonado) ? data.abandonado : []
          });
          setUserData(prevStats => ({
            ...prevStats,
            stats: {
              ...prevStats.stats,
              totalGames: (data.jogando?.length || 0) + (data.zerado?.length || 0) + (data.abandonado?.length || 0),
              completedGames: data.zerado?.length || 0,
              abandonedGames: data.abandonado?.length || 0
            }
          }));
        } catch (error) {
          console.error('Perfil.jsx - Erro ao buscar jogos do utilizador por status:', error);
        }
      };

      const fetchUserReviews = async (idToFetch) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/users/${idToFetch}/reviews`);
          if (!response.ok) {
            throw new Error('Falha ao buscar avaliações do utilizador');
          }
          const data = await response.json();
          setRecentReviews(Array.isArray(data) ? data : []); // Certifique-se que é um array
          setUserData(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              posts: Array.isArray(data) ? data.length : 0
            }
          }));
        } catch (error) {
          console.error('Perfil.jsx - Erro ao buscar avaliações do utilizador:', error);
        }
      };

      fetchUserProfile(loggedInUserId);
      fetchUserGamesByStatus(loggedInUserId);
      fetchUserReviews(loggedInUserId);
      refreshFollowCounts();

    } else {
      console.log("Perfil.jsx - loggedInUserId não disponível.");
    }
  }, [loggedInUserId]);


  const renderStars = (rating) => {
    const roundedRating = Math.round(rating);
    return Array.from({ length: roundedRating }, (_, i) => (
      <span key={i} className="star">★</span>
    ));
  };

  const gameStatusSections = [
    { title: 'JOGANDO', key: 'jogando' },
    { title: 'ZERADOS', key: 'zerado' },
    { title: 'ABANDONADOS', key: 'abandonado' }
  ];

  const handleEditBioClick = () => {
    setIsEditingBio(true);
    setNewBio(userData.bio);
  };

  const handleSaveBio = async () => {
    if (!userData.userId) {
      console.error("ID de utilizador não disponível para guardar a biografia.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userData.userId}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: newBio }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar a biografia');
      }
      const data = await response.json();
      console.log(data.message);
      setUserData(prev => ({ ...prev, bio: newBio }));
      setIsEditingBio(false);
    } catch (error) {
      console.error('Erro ao atualizar a biografia:', error);
      alert(`Erro ao salvar biografia: ${error.message}`);
    }
  };

  const handleCancelEditBio = () => {
    setIsEditingBio(false);
    setNewBio(userData.bio);
  };

  const handleAddGameClick = () => {
    setIsAddingGame(true);
    setNewGameName('');
    setNewGameStatus('jogando');
    setSearchResults([]);
    setSelectedGame(null);
  };

  const handleSearchGames = async (e) => {
    setNewGameName(e.target.value);
    if (e.target.value.length > 2) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/games?search=${encodeURIComponent(e.target.value)}&page_size=5`);
        if (!response.ok) {
          throw new Error('Falha ao buscar resultados da pesquisa de jogos');
        }
        const data = await response.json();
        setSearchResults(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        console.error('Erro ao pesquisar jogos:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setNewGameName(game.name);
    setSearchResults([]);
  };

  const handleSaveGame = async () => {
    if (!loggedInUserId || !selectedGame || !newGameStatus) {
      console.error("ID de utilizador logado, jogo selecionado ou status do jogo em falta.");
      alert("Por favor, selecione um jogo e um status.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${loggedInUserId}/games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome_jogo: selectedGame.name, status: newGameStatus }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao adicionar/atualizar jogo');
      }
      const data = await response.json();
      console.log(data.message);
      setIsAddingGame(false);

      const gamesResponse = await fetch(`${API_BASE_URL}/api/users/${loggedInUserId}/games_by_status`);
      if (!gamesResponse.ok) {
        throw new Error('Falha ao buscar novamente os jogos do utilizador por status após adicionar');
      }
      const gamesData = await gamesResponse.json();
      setUserGamesByStatus({
        jogando: Array.isArray(gamesData.jogando) ? gamesData.jogando : [],
        zerado: Array.isArray(gamesData.zerado) ? gamesData.zerado : [],
        abandonado: Array.isArray(gamesData.abandonado) ? gamesData.abandonado : []
      });
      setUserData(prevStats => ({
        ...prevStats,
        stats: {
          ...prevStats.stats,
          totalGames: (gamesData.jogando?.length || 0) + (gamesData.zerado?.length || 0) + (gamesData.abandonado?.length || 0),
          completedGames: gamesData.zerado?.length || 0,
          abandonedGames: gamesData.abandonado?.length || 0
        }
      }));

    } catch (error) {
      console.error('Erro ao adicionar/atualizar jogo:', error);
      alert(`Erro ao adicionar jogo: ${error.message}`);
    }
  };

  const handleCancelAddGame = () => {
    setIsAddingGame(false);
    setNewGameName('');
    setNewGameStatus('jogando');
    setSearchResults([]);
    setSelectedGame(null);
  };

  const handleDeleteGame = async (gameName) => {
    if (!loggedInUserId) {
      console.error("Não autorizado a remover jogo.");
      return;
    }

    if (!window.confirm(`Tem certeza que deseja remover "${gameName}" da sua coleção?`)) {
      return;
    }

    try {
      const encodedGameName = encodeURIComponent(gameName);
      const response = await fetch(`${API_BASE_URL}/api/users/${loggedInUserId}/games/${encodedGameName}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao remover jogo');
      }

      const data = await response.json();
      console.log(data.message);

      const gamesResponse = await fetch(`${API_BASE_URL}/api/users/${loggedInUserId}/games_by_status`);
      if (!gamesResponse.ok) {
        throw new Error('Falha ao buscar novamente os jogos do utilizador por status após remover');
      }
      const gamesData = await gamesResponse.json();
      setUserGamesByStatus({
        jogando: Array.isArray(gamesData.jogando) ? gamesData.jogando : [],
        zerado: Array.isArray(gamesData.zerado) ? gamesData.zerado : [],
        abandonado: Array.isArray(gamesData.abandonado) ? gamesData.abandonado : []
      });
      setUserData(prevStats => ({
        ...prevStats,
        stats: {
          ...prevStats.stats,
          totalGames: (gamesData.jogando?.length || 0) + (gamesData.zerado?.length || 0) + (gamesData.abandonado?.length || 0),
          completedGames: gamesData.zerado?.length || 0,
          abandonedGames: gamesData.abandonado?.length || 0
        }
      }));

    } catch (error) {
      console.error('Erro ao remover jogo:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!loggedInUserId) {
      console.error("Não autorizado a remover avaliação.");
      return;
    }

    console.log(`Tentando remover avaliação com ID: ${reviewId} pelo user_id logado: ${loggedInUserId}`);
    if (!window.confirm("Tem certeza que deseja remover esta avaliação?")) {
      console.log("Remoção de avaliação cancelada pelo usuário.");
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/users/${loggedInUserId}/reviews/${reviewId}`;
      console.log(`Fazendo requisição DELETE para: ${url}`);
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include'
      });

      console.log(`Resposta da API DELETE: Status ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro detalhado da API:', errorData);
        throw new Error(errorData.message || 'Falha ao remover avaliação');
      }

      const data = await response.json();
      console.log('Mensagem de sucesso da API:', data.message);

      const reviewsResponse = await fetch(`${API_BASE_URL}/api/users/${loggedInUserId}/reviews`);
      if (!reviewsResponse.ok) {
        throw new Error('Falha ao buscar novamente as avaliações do utilizador após remover');
      }
      const reviewsData = await reviewsResponse.json();
      setRecentReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setUserData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          posts: Array.isArray(reviewsData) ? reviewsData.length : 0
        }
      }));
      console.log("Avaliação removida e lista atualizada com sucesso.");

    } catch (error) {
      console.error('Erro ao remover avaliação:', error);
      alert(`Erro: ${error.message}`);
    }
  };


  const openFollowPanel = (tab, searchTerm = '') => {
    setActiveFollowTab(tab);
    setTopSearchTerm(searchTerm);
    setShowFollowPanel(true);
  };

  const closeFollowPanel = () => {
    setShowFollowPanel(false);
    setTopSearchTerm('');
    refreshFollowCounts();
  };


  return (
    <div className="profile-container">
      <div className="search-users-panel-top">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Buscar usuários..."
            className="search-input-top"
            value={topSearchTerm}
            onChange={(e) => setTopSearchTerm(e.target.value)}
          />
          <button className="search-button-top" onClick={() => openFollowPanel('buscar', topSearchTerm)}>
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="profile-header">
        <img src={userData.avatar_url} alt="Avatar do Usuário" className="profile-avatar" />
        <div className="profile-info">
          <h1>{userData.username}</h1>
          <p className="profile-bio">{userData.bio}</p>
          {isMyProfile && (
            <button onClick={handleEditBioClick} className="edit-bio-button">
              <FaEdit /> Editar Biografia
            </button>
          )}
          <div className="profile-stats">
            <span className="stat-item">Posts: {userData.stats.posts}</span>
            <span className="stat-item clickable" onClick={() => openFollowPanel('seguidores')}>
              Seguidores: {userData.stats.followers}
            </span>
            <span className="stat-item clickable" onClick={() => openFollowPanel('seguindo')}>
              Seguindo: {userData.stats.following}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-game-stats">
        <span>Total de Jogos: {userData.stats.totalGames}</span>
        <span>Jogos Zerados: {userData.stats.completedGames}</span>
        <span>Jogos Abandonados: {userData.stats.abandonedGames}</span>
        {isMyProfile && (
          <button onClick={handleAddGameClick} className="add-game-button">
            <FaPlus /> Adicionar Jogo
          </button>
        )}
      </div>

      {showFollowPanel && (
        <div className="seguidores-wrapper">
          <button className="close-follow-panel-button" onClick={closeFollowPanel}>
            <FaTimes />
          </button>
          <SeguidoresESeguindo
            userId={loggedInUserId}
            initialTab={activeFollowTab}
            initialSearchTerm={topSearchTerm}
            onFollowStatusChange={refreshFollowCounts}
          />
        </div>
      )}

      <div className="profile-content">
        <div className="profile-games-section">
          <h2>Meus Jogos</h2>
          {Object.keys(userGamesByStatus).map(status => (
            <div key={status} className="game-status-category">
              <h3>{status.charAt(0).toUpperCase() + status.slice(1)}</h3>
              <div className="game-list">
                {userGamesByStatus[status].length > 0 ? (
                  userGamesByStatus[status].map(game => (
                    <div key={game.id || game.name} className="game-card">
                      <img src={game.background_image || defaultAvatar || ''} alt={game.name} className="game-image" />
                      <span>{game.name}</span>
                      {isMyProfile && (
                        <button
                          className="remove-button game-remove-button"
                          onClick={() => handleDeleteGame(game.name)}
                          title="Remover jogo da coleção"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p>Nenhum jogo nesta categoria.</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="profile-reviews-section">
          <h2>Avaliações Recentes</h2>
          <div className="reviews-list">
            {recentReviews.length > 0 ? (
              recentReviews.map(review => (
                <div key={review.id} className="review-card">
                  <img src={review.background_image || defaultAvatar || ''} alt={review.nome_jogo} className="review-game-image" />
                  <div className="review-content">
                    <h4>{review.nome_jogo}</h4>
                    <p>Nota: {renderStars(review.nota)}</p>
                    <p>{review.comentario}</p>
                    <p className="review-date">{new Date(review.data_avaliacao).toLocaleDateString()}</p>
                  </div>
                  {isMyProfile && (
                    <button
                      className="remove-button review-remove-button"
                      onClick={() => handleDeleteReview(review.id)}
                      title="Remover avaliação"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p>Nenhuma avaliação recente.</p>
            )}
          </div>
        </div>
      </div>

      {isEditingBio && (
        <div className="modal">
          <div className="modal-content">
            <h2>Editar Biografia</h2>
            <textarea
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              rows="5"
              placeholder="Escreva sua biografia aqui..."
            ></textarea>
            <div className="modal-buttons">
              <button className="button-primary" onClick={handleSaveBio}>Salvar</button>
              <button className="button-secondary" onClick={handleCancelEditBio}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {isAddingGame && (
        <div className="modal">
          <div className="modal-content">
            <h2>Adicionar Novo Jogo</h2>
            <div className="form-group">
              <label htmlFor="gameName">Nome do Jogo:</label>
              <div className="search-input-container">
                <input
                  type="text"
                  id="gameName"
                  value={newGameName}
                  onChange={handleSearchGames}
                  placeholder="Buscar jogo..."
                />
                <button onClick={handleSearchGames} className="search-button"><FaSearch /></button>
              </div>
              {searchResults.length > 0 && newGameName.length > 2 && !selectedGame && (
                <ul className="search-results-list">
                  {searchResults.map(game => (
                    <li key={game.id} onClick={() => handleSelectGame(game)} className="search-result-item">
                      <img src={game.background_image || defaultAvatar || ''} alt={game.name} className="search-result-image" />
                      <span>{game.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              {selectedGame && (
                <p className="selected-game-info">Jogo selecionado: <strong>{selectedGame.name}</strong></p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="gameStatus">Status:</label>
              <select
                id="gameStatus"
                value={newGameStatus}
                onChange={(e) => setNewGameStatus(e.target.value)}
              >
                <option value="jogando">Jogando</option>
                <option value="zerado">Zerado</option>
                <option value="abandonado">Abandonado</option>
              </select>
            </div>
            <div className="modal-buttons">
              <button className="button-primary" onClick={handleSaveGame} disabled={!selectedGame}>Adicionar Jogo</button>
              <button className="button-secondary" onClick={handleCancelAddGame}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;