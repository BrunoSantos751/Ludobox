import React, { useState, useEffect, useCallback } from 'react';
import { FaUserPlus, FaSearch, FaUserMinus } from 'react-icons/fa';
import defaultAvatar from "../../assets/images/imagem-perfil.jpg"; // VERIFIQUE ESTE CAMINHO
import { API_BASE_URL } from '../../config';
import { Link } from 'react-router-dom';

function SeguidoresESeguindo({ userId, initialTab, initialSearchTerm, onFollowStatusChange }) {
  const [seguindo, setSeguindo] = useState([]);
  const [seguidores, setSeguidores] = useState([]);
  const [buscaUsuarios, setBuscaUsuarios] = useState([]);
  const [termoBusca, setTermoBusca] = useState(initialSearchTerm || '');
  const [activeTab, setActiveTab] = useState(initialTab || 'buscar');

  // Função para buscar os seguidores e quem o usuário está seguindo
  const fetchFollowData = useCallback(() => { // Usar useCallback para otimização
    if (!userId) return;

    // Buscar quem o usuário logado está seguindo
    fetch(`${API_BASE_URL}/api/users/${userId}/seguindo`)
      .then(res => {
        if (!res.ok) throw new Error('Falha ao buscar quem você segue');
        return res.json();
      })
      .then(data => setSeguindo(Array.isArray(data) ? data : []))
      .catch(err => console.error('Erro ao buscar quem você segue:', err));

    // Buscar os seguidores do usuário logado
    fetch(`${API_BASE_URL}/api/users/${userId}/seguidores`)
      .then(res => {
        if (!res.ok) throw new Error('Falha ao buscar seguidores');
        return res.json();
      })
      .then(data => setSeguidores(Array.isArray(data) ? data : []))
      .catch(err => console.error('Erro ao buscar seguidores:', err));
  }, [userId]); // Depende de userId para refetch


  useEffect(() => {
    fetchFollowData();
  }, [userId, fetchFollowData]); // Adicionado fetchFollowData às dependências


  useEffect(() => {
    if (initialTab) {
        setActiveTab(initialTab);
    }
    if (initialSearchTerm) {
        setTermoBusca(initialSearchTerm);
    }
  }, [initialTab, initialSearchTerm]);

  // Novo useEffect para disparar a busca quando termoBusca ou activeTab (se for 'buscar') mudar
  const handleBuscarUsuarios = useCallback(async () => { // Usar useCallback para otimização
    if (termoBusca.length < 2) {
      setBuscaUsuarios([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/search?query=${encodeURIComponent(termoBusca)}`);
      if (!res.ok) throw new Error('Falha ao buscar resultados da pesquisa de usuários');
      const data = await res.json();
      // Filtra o próprio usuário da lista de resultados
      setBuscaUsuarios(data.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setBuscaUsuarios([]); // Limpa resultados em caso de erro
    }
  }, [termoBusca, userId]);


  useEffect(() => {
    if (activeTab === 'buscar' && termoBusca.length >= 2) {
      handleBuscarUsuarios();
    } else if (activeTab === 'buscar' && termoBusca.length < 2) {
      setBuscaUsuarios([]); // Limpa resultados se o termo for muito curto
    }
  }, [termoBusca, activeTab, handleBuscarUsuarios]); // Adicionado handleBuscarUsuarios às dependências


  const seguirUsuario = async (idToFollow) => {
    if (!userId) {
      alert('Você precisa estar logado para seguir alguém.');
      return;
    }
    if (userId === idToFollow) {
      alert('Você não pode seguir a si mesmo.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/follow`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seguidor_id: userId, seguindo_id: idToFollow }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao seguir usuário');
      }
      console.log('Seguindo com sucesso!');
      // Otimistic update: Adiciona o usuário à lista de 'seguindo' imediatamente
      //setSeguindo(prevSeguindo => [...prevSeguindo, { id: idToFollow }]);
      
      fetchFollowData(); // Atualiza as listas completas após seguir
      handleBuscarUsuarios(); // Re-executa a busca para atualizar o botão
      if (onFollowStatusChange) onFollowStatusChange(); // Notifica o componente pai
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
      alert(`Erro ao seguir usuário: ${error.message}`);
      // Em caso de erro, re-fetch para reverter o update otimista
      fetchFollowData();
      handleBuscarUsuarios();
    }
  };

  const deixarDeSeguirUsuario = async (idToUnfollow) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/unfollow`, {
        method: 'POST', 
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seguidor_id: userId, seguindo_id: idToUnfollow })
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Em caso de erro, re-fetch para garantir que as listas estejam corretas
        fetchFollowData();
        handleBuscarUsuarios();
        throw new Error(errorData.message || 'Erro ao deixar de seguir usuário');
      }

      console.log('Deixou de seguir com sucesso!');
      
      // Otimistic update: Remove o usuário da lista 'seguindo' imediatamente
      setSeguindo(prevSeguindo => prevSeguindo.filter(user => user.id !== idToUnfollow));
      
      // Atualizar as listas completas após o sucesso
      fetchFollowData(); // Re-fetch all follow data for consistency
      handleBuscarUsuarios(); // Re-fetch search results to update follow buttons
      if (onFollowStatusChange) onFollowStatusChange(); // Notifica o componente pai (Perfil.jsx)

    } catch (error) {
      console.error('Erro ao deixar de seguir usuário:', error);
      // Mantém o alert aqui, pois este é para erros REAIS que o backend retornou
      // Em caso de erro, re-fetch para reverter o update otimista
      fetchFollowData();
      handleBuscarUsuarios();
    }
  };

  const isFollowing = (targetUserId) => {
    return seguindo.some(user => user.id === targetUserId);
  };

  return (
    <div className="seguidores-container">
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'seguidores' ? 'active' : ''}`}
          onClick={() => setActiveTab('seguidores')}
        >
          Seguidores
        </button>
        <button
          className={`tab-button ${activeTab === 'seguindo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seguindo')}
          style={{ position: 'relative' }} // Adicionado para o badge
        >
          Seguindo
          {seguindo.length > 0 && <span className="follow-count-badge">{seguindo.length}</span>}
        </button>
        <button
          className={`tab-button ${activeTab === 'buscar' ? 'active' : ''}`}
          onClick={() => setActiveTab('buscar')}
        >
          Buscar Usuários
        </button>
      </div>

      {activeTab === 'seguidores' && (
        <div className="tab-content">
          <h2 className="section-title">MEUS SEGUIDORES</h2>
          <div className="seguidores-list">
            {seguidores.length > 0 ? (
              seguidores.map(user => (
                <div key={user.id} className="user-card">
                  <Link to={`/perfil?id=${user.id}`}>
                    <img src={user.avatar_url || defaultAvatar} alt={user.nome} className="user-avatar" />
                  </Link>
                  <span>{user.nome}</span>
                  {/* Condição para seguir/deixar de seguir na lista de seguidores */}
                  {!isFollowing(user.id) && user.id !== userId && (
                    <button onClick={() => seguirUsuario(user.id)} className="seguir-button">
                      <FaUserPlus /> Seguir
                    </button>
                  )}
                  {isFollowing(user.id) && user.id !== userId && (
                    <button onClick={() => deixarDeSeguirUsuario(user.id)} className="unfollow-button">
                      <FaUserMinus /> Deixar de Seguir
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="no-results-message">Nenhum seguidor ainda.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'seguindo' && (
        <div className="tab-content">
          <h2 className="section-title">ESTOU SEGUINDO</h2>
          <div className="seguindo-list">
            {seguindo.length > 0 ? (
              seguindo.map(user => (
                <div key={user.id} className="user-card">
                  <Link to={`/perfil?id=${user.id}`}>
                    <img src={user.avatar_url || defaultAvatar} alt={user.nome} className="user-avatar" />
                  </Link>
                  <span>{user.nome}</span>
                  {user.id !== userId && ( // Não permite deixar de seguir a si mesmo
                    <button onClick={() => deixarDeSeguirUsuario(user.id)} className="unfollow-button">
                      <FaUserMinus /> Deixar de Seguir
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="no-results-message">Você não está seguindo ninguém.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'buscar' && (
        <div className="tab-content">
          <h2 className="section-title">BUSCAR OUTROS USUÁRIOS</h2>
          <div className="busca-usuarios">
            <div className="search-input-group">
              <input
                type="text"
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
                placeholder="Digite um nome..."
                className="search-input"
              />
              <button onClick={handleBuscarUsuarios} className="search-button">
                <FaSearch />
              </button>
            </div>
            <div className="busca-resultados">
              {buscaUsuarios.length > 0 ? (
                buscaUsuarios.map(user => (
                  <div key={user.id} className="user-card">
                    <Link to={`/perfil?id=${user.id}`}>  
                      <img src={user.avatar_url || defaultAvatar} alt={user.nome} className="user-avatar" />
                    </Link>
                    <span>{user.nome}</span>
                    {/* Verifica se o usuário já está sendo seguido ou é o próprio usuário logado */}
                    {!isFollowing(userId)  (
                      <button onClick={() => seguirUsuario(user.id)} className="seguir-button">
                        <FaUserPlus /> Seguir
                      </button>
                    )}
                    {isFollowing(userId)  (
                      <button onClick={() => deixarDeSeguirUsuario(user.id)} className="unfollow-button">
                        <FaUserMinus /> Deixar de Seguir
                      </button>
                    )}
                  </div>
                ))
              ) : termoBusca.length >= 2 ? (
                <p className="no-results-message">Nenhum usuário encontrado.</p>
              ) : (
                <p className="no-results-message">Digite pelo menos 2 caracteres para buscar.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeguidoresESeguindo;