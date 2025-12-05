#!/usr/bin/env python3
"""
Script para criar o banco de dados e todas as tabelas do projeto Ludobox.
Execute este script após configurar o PostgreSQL e o arquivo conexao.env
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv(dotenv_path="conexao.env")

# Configurações do banco de dados
DB_NAME = os.getenv("DB_NAME", "catalago_jogos")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

def create_database():
    """Cria o banco de dados se não existir"""
    try:
        # Conectar ao PostgreSQL (sem especificar o banco)
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database="postgres"  # Conecta ao banco padrão
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Verificar se o banco já existe
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f'CREATE DATABASE {DB_NAME}')
            print(f"✅ Banco de dados '{DB_NAME}' criado com sucesso!")
        else:
            print(f"ℹ️  Banco de dados '{DB_NAME}' já existe.")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Erro ao criar banco de dados: {e}")
        return False

def create_tables():
    """Cria todas as tabelas necessárias"""
    try:
        # Conectar ao banco de dados
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        # ============================================
        # TABELA: users
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                senha VARCHAR(255),
                bio TEXT DEFAULT '',
                avatar_url TEXT,
                steam_id VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Índices para users
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id)")
        print("✅ Tabela 'users' criada/verificada")
        
        # ============================================
        # TABELA: avaliacoes
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS avaliacoes (
                avaliacao_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 10),
                comentario TEXT NOT NULL,
                nome_jogo VARCHAR(255) NOT NULL,
                likes INTEGER DEFAULT 0,
                data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Índices para avaliacoes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_avaliacoes_user_id ON avaliacoes(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_avaliacoes_nome_jogo ON avaliacoes(nome_jogo)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_avaliacoes_likes ON avaliacoes(likes DESC)")
        print("✅ Tabela 'avaliacoes' criada/verificada")
        
        # ============================================
        # TABELA: user_evaluation_likes
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_evaluation_likes (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                avaliacao_id INTEGER NOT NULL REFERENCES avaliacoes(avaliacao_id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, avaliacao_id)
            )
        """)
        
        # Índices para user_evaluation_likes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_eval_likes_user_id ON user_evaluation_likes(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_eval_likes_avaliacao_id ON user_evaluation_likes(avaliacao_id)")
        print("✅ Tabela 'user_evaluation_likes' criada/verificada")
        
        # ============================================
        # TABELA: user_games
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_games (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                nome_jogo VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL CHECK (status IN ('jogando', 'zerado', 'abandonado')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, nome_jogo)
            )
        """)
        
        # Índices para user_games
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON user_games(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_games_status ON user_games(status)")
        print("✅ Tabela 'user_games' criada/verificada")
        
        # ============================================
        # TABELA: jogos_favoritos
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jogos_favoritos (
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                game_id INTEGER NOT NULL,
                game_name VARCHAR(255) NOT NULL,
                game_image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, game_id)
            )
        """)
        
        # Índices para jogos_favoritos
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_jogos_favoritos_user_id ON jogos_favoritos(user_id)")
        print("✅ Tabela 'jogos_favoritos' criada/verificada")
        
        # ============================================
        # TABELA: follows
        # ============================================
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                seguidor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                seguindo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (seguidor_id, seguindo_id),
                CHECK (seguidor_id != seguindo_id)
            )
        """)
        
        # Índices para follows
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_follows_seguidor_id ON follows(seguidor_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_follows_seguindo_id ON follows(seguindo_id)")
        print("✅ Tabela 'follows' criada/verificada")
        
        # Commit das alterações
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n🎉 Todas as tabelas foram criadas/verificadas com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_tables():
    """Verifica se todas as tabelas foram criadas corretamente"""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        # Listar todas as tabelas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print("\n📊 Tabelas criadas no banco de dados:")
        for table in tables:
            print(f"   - {table[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar tabelas: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Configuração do Banco de Dados - Ludobox")
    print("=" * 60)
    print(f"\n📝 Configurações:")
    print(f"   Host: {DB_HOST}")
    print(f"   Port: {DB_PORT}")
    print(f"   Database: {DB_NAME}")
    print(f"   User: {DB_USER}")
    print("\n" + "=" * 60 + "\n")
    
    # Criar banco de dados
    if create_database():
        # Criar tabelas
        if create_tables():
            # Verificar tabelas
            verify_tables()
            print("\n✅ Setup completo! O banco de dados está pronto para uso.")
        else:
            print("\n❌ Erro ao criar tabelas. Verifique os logs acima.")
    else:
        print("\n❌ Erro ao criar banco de dados. Verifique os logs acima.")

