import React, { useEffect, useState } from 'react';
import './Perfil.css';
import defaultAvatar from "../../assets/images/imagem-perfil.jpg";
import { FaEdit, FaPlus, FaSearch, FaTimes } from 'react-icons/fa'; // Importing icons, including FaTimes
import SeguidoresESeguindo from './SeguidoresESeguindo';


// Agora o componente Profile espera userId e username como props
function Profile({ userId: propUserId, username: propUsername }) {
  const [userGamesByStatus, setUserGamesByStatus] = useState({
    jogando: [],
    zerado: [],
    abandonado: []
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [userData, setUserData] = useState({
    userId: propUserId, // Usar propUserId como ID inicial
    username: propUsername || 'Carregando nome...', // Usar propUsername como nome de usuário inicial, com fallback
    bio: 'Nenhuma biografia definida.',
    avatar_url: defaultAvatar,
    stats: {
      posts: 0,
      followers: 0,
      following: 0,
      totalGames: 0,
      completedGames: 0,
      abandonedGames: 0
    }
  });

  // State for editing bio modal
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');

  // State for adding game modal
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameStatus, setNewGameStatus] = useState('jogando'); // Default status
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  // Estados para controlar a visibilidade do painel de seguidores/seguindo
  const [showFollowPanel, setShowFollowPanel] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState('buscar'); // 'seguidores', 'seguindo', 'buscar'
  const [topSearchTerm, setTopSearchTerm] = useState(''); // Estado para o input de busca do topo

  // Efeito para carregar dados do usuário (bio, avatar, estatísticas)
  useEffect(() => {
    if (!userData.userId) {
      console.log("UserID não disponível, pulando fetch de dados do perfil.");
      return;
    }

    console.log(`Buscando dados para o usuário: ${userData.userId}`);
    fetch(`http://localhost:8080/api/users/${userData.userId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setUserData(prevData => ({
          ...prevData,
          username: data.username,
          bio: data.bio || 'Nenhuma biografia definida.',
          avatar_url: data.avatar_url || defaultAvatar,
        }));
      })
      .catch(error => console.error("Erro ao buscar dados do usuário:", error));

    fetch(`http://localhost:8080/api/users/${userData.userId}/games`)
      .then(res => res.json())
      .then(games => {
        const gamesByStatus = {
          jogando: games.filter(game => game.status === 'jogando'),
          zerado: games.filter(game => game.status === 'zerado'),
          abandonado: games.filter(game => game.status === 'abandonado'),
        };
        setUserGamesByStatus(gamesByStatus);
        setUserData(prevData => ({
          ...prevData,
          stats: {
            ...prevData.stats,
            totalGames: games.length,
            completedGames: gamesByStatus.zerado.length,
            abandonedGames: gamesByStatus.abandonado.length
          }
        }));
      })
      .catch(error => console.error("Erro ao buscar jogos do usuário:", error));

    fetch(`http://localhost:8080/api/users/${userData.userId}/reviews`)
      .then(res => res.json())
      .then(setRecentReviews)
      .catch(error => console.error("Erro ao buscar avaliações recentes:", error));

    // FETCH PARA SEGUIDORES E SEGUINDO - NOVO
    fetch(`http://localhost:8080/api/users/${userData.userId}/seguidores`)
      .then(res => res.json())
      .then(data => {
        setUserData(prevData => ({
          ...prevData,
          stats: { ...prevData.stats, followers: data.length }
        }));
      })
      .catch(error => console.error("Erro ao buscar seguidores:", error));

    fetch(`http://localhost:8080/api/users/${userData.userId}/seguindo`)
      .then(res => res.json())
      .then(data => {
        setUserData(prevData => ({
          ...prevData,
          stats: { ...prevData.stats, following: data.length }
        }));
      })
      .catch(error => console.error("Erro ao buscar seguindo:", error));

  }, [userData.userId]); // Dependência: recarregar quando userId mudar


  const handleEditBio = () => {
    setNewBio(userData.bio);
    setIsEditingBio(true);
  };

  const handleSaveBio = () => {
    fetch(`http://localhost:8080/api/users/${userData.userId}/bio`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bio: newBio }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to save bio');
        }
        return res.json();
      })
      .then(data => {
        setUserData(prevData => ({ ...prevData, bio: newBio }));
        setIsEditingBio(false);
        alert(data.message);
      })
      .catch(error => {
        console.error("Erro ao salvar biografia:", error);
        alert("Erro ao salvar biografia.");
      });
  };

  const handleCancelEditBio = () => {
    setIsEditingBio(false);
  };

  const handleAddGame = () => {
    setIsAddingGame(true);
  };

  const handleSearchGame = async () => {
    if (newGameName.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:8080/api/games/search?query=${encodeURIComponent(newGameName)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Erro ao buscar jogos:", error);
      setSearchResults([]);
    }
  };

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setNewGameName(game.name); // Preenche o input com o nome do jogo selecionado
    setSearchResults([]); // Limpa os resultados da busca
  };

  const handleSaveGame = async () => {
    if (!selectedGame) {
      alert('Por favor, selecione um jogo.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/users/${userData.userId}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_id: selectedGame.id,
          name: selectedGame.name,
          background_image: selectedGame.background_image,
          status: newGameStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao adicionar jogo.');
      }

      const data = await res.json();
      alert(data.message);

      // Atualiza o estado local para refletir o novo jogo adicionado
      setUserGamesByStatus(prevGames => {
        const updatedGames = { ...prevGames };
        updatedGames[newGameStatus] = [...updatedGames[newGameStatus], {
          game_id: selectedGame.id,
          name: selectedGame.name,
          background_image: selectedGame.background_image,
          status: newGameStatus,
        }];
        return updatedGames;
      });

      // Atualiza as estatísticas de jogos
      setUserData(prevData => ({
        ...prevData,
        stats: {
          ...prevData.stats,
          totalGames: prevData.stats.totalGames + 1,
          completedGames: newGameStatus === 'zerado' ? prevData.stats.completedGames + 1 : prevData.stats.completedGames,
          abandonedGames: newGameStatus === 'abandonado' ? prevData.stats.abandonedGames + 1 : prevData.stats.abandonedGames,
        }
      }));


      setIsAddingGame(false);
      setNewGameName('');
      setSelectedGame(null);
      setNewGameStatus('jogando'); // Reset para o padrão
    } catch (error) {
      console.error("Erro ao adicionar jogo:", error);
      alert(error.message);
    }
  };

  const handleCancelAddGame = () => {
    setIsAddingGame(false);
    setNewGameName('');
    setSearchResults([]);
    setSelectedGame(null);
    setNewGameStatus('jogando');
  };

  // Função para abrir o painel de seguidores/seguindo na aba correta
  const openFollowPanel = (tab, searchTerm = '') => {
    setActiveFollowTab(tab);
    setTopSearchTerm(searchTerm); // Define o termo de busca para ser passado ao componente
    setShowFollowPanel(true);
  };

  // Função para fechar o painel de seguidores/seguindo
  const closeFollowPanel = () => {
    setShowFollowPanel(false);
    setTopSearchTerm(''); // Limpa o termo de busca ao fechar
  };

  return (
    <div className="profile-container">
      {/* Nova barra de busca de usuários no topo da página */}
      <div className="search-users-panel-top">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Buscar usuários..."
            className="search-input-top"
            value={topSearchTerm}
            onChange={(e) => setTopSearchTerm(e.target.value)}
            // Nao chame openFollowPanel aqui, chame no botão ou no clique do campo para pesquisar
            // pois queremos que o painel abra com o termo de busca ao clicar no botão
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
          <button onClick={handleEditBio} className="edit-bio-button">
            <FaEdit /> Editar Biografia
          </button>
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
        <button onClick={handleAddGame} className="add-game-button">
          <FaPlus /> Adicionar Jogo
        </button>
      </div>


      {/* O painel de seguidores/seguindo será exibido aqui */}
      {showFollowPanel && (
        <div className="seguidores-wrapper">
          <button className="close-follow-panel-button" onClick={closeFollowPanel}>
            <FaTimes />
          </button>
          <SeguidoresESeguindo
            userId={userData.userId}
            initialTab={activeFollowTab}
            initialSearchTerm={topSearchTerm} // Passa o termo de busca para o componente
          />
        </div>
      )}

      {/* Conteúdo original de jogos e avaliações */}
      <div className="profile-content">
        <div className="profile-games-section">
          <h2>Meus Jogos</h2>
          {Object.keys(userGamesByStatus).map(status => (
            <div key={status} className="game-status-category">
              <h3>{status.charAt(0).toUpperCase() + status.slice(1)}</h3>
              <div className="game-list">
                {userGamesByStatus[status].length > 0 ? (
                  userGamesByStatus[status].map(game => (
                    <div key={game.game_id} className="game-card">
                      <img src={game.background_image || defaultAvatar} alt={game.name} className="game-image" />
                      <span>{game.name}</span>
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
                <div key={review.avaliacao_id} className="review-card">
                  <img src={review.background_image || defaultAvatar} alt={review.nome_jogo} className="review-game-image" />
                  <div className="review-content">
                    <h4>{review.nome_jogo}</h4>
                    <p>Nota: {review.nota}/5</p>
                    <p>{review.comentario}</p>
                    <p className="review-date">{new Date(review.data_avaliacao).toLocaleDateString()}</p>
                  </div>
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
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="Buscar jogo..."
                />
                <button onClick={handleSearchGame} className="search-button"><FaSearch /></button>
              </div>
              {searchResults.length > 0 && (
                <ul className="search-results-list">
                  {searchResults.map(game => (
                    <li key={game.id} onClick={() => handleSelectGame(game)} className="search-result-item">
                      <img src={game.background_image || defaultAvatar} alt={game.name} className="search-result-image" />
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