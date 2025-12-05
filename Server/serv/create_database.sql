-- Script de criação do banco de dados Ludobox
-- Execute este script no PostgreSQL para criar todas as tabelas necessárias

-- ============================================
-- TABELA: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255),
    bio TEXT DEFAULT '',
    avatar_url TEXT,
    steam_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);

-- ============================================
-- TABELA: avaliacoes
-- ============================================
CREATE TABLE IF NOT EXISTS avaliacoes (
    avaliacao_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 10),
    comentario TEXT NOT NULL,
    nome_jogo VARCHAR(255) NOT NULL,
    likes INTEGER DEFAULT 0,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_avaliacoes_user_id ON avaliacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_nome_jogo ON avaliacoes(nome_jogo);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_likes ON avaliacoes(likes DESC);

-- ============================================
-- TABELA: user_evaluation_likes
-- ============================================
CREATE TABLE IF NOT EXISTS user_evaluation_likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avaliacao_id INTEGER NOT NULL REFERENCES avaliacoes(avaliacao_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, avaliacao_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_eval_likes_user_id ON user_evaluation_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_eval_likes_avaliacao_id ON user_evaluation_likes(avaliacao_id);

-- ============================================
-- TABELA: user_games
-- ============================================
CREATE TABLE IF NOT EXISTS user_games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome_jogo VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('jogando', 'zerado', 'abandonado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, nome_jogo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_status ON user_games(status);

-- ============================================
-- TABELA: jogos_favoritos
-- ============================================
CREATE TABLE IF NOT EXISTS jogos_favoritos (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL,
    game_name VARCHAR(255) NOT NULL,
    game_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_jogos_favoritos_user_id ON jogos_favoritos(user_id);

-- ============================================
-- TABELA: follows
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
    seguidor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seguindo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (seguidor_id, seguindo_id),
    CHECK (seguidor_id != seguindo_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_follows_seguidor_id ON follows(seguidor_id);
CREATE INDEX IF NOT EXISTS idx_follows_seguindo_id ON follows(seguindo_id);

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================
COMMENT ON TABLE users IS 'Tabela de usuários do sistema (pode ter login por email ou Steam)';
COMMENT ON TABLE avaliacoes IS 'Avaliações de jogos feitas pelos usuários';
COMMENT ON TABLE user_evaluation_likes IS 'Registro de likes de usuários em avaliações';
COMMENT ON TABLE user_games IS 'Jogos adicionados pelos usuários com seus status';
COMMENT ON TABLE jogos_favoritos IS 'Jogos favoritos dos usuários';
COMMENT ON TABLE follows IS 'Relação de seguidores/seguindo entre usuários';

