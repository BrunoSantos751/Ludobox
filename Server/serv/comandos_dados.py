import sqlite3
from datetime import datetime

# Caminho para o banco de dados
DB_PATH = 'catalogo_jogos.db'

# Conectar ao banco
def conectar():
    return sqlite3.connect(DB_PATH)

# ===================== USERS =====================

def criar_usuario(nome, email, senha, bio='', avatar_url=''):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (nome, email, senha, bio, avatar_url)
        VALUES (?, ?, ?, ?, ?)
    """, (nome, email, senha, bio, avatar_url))
    conn.commit()
    conn.close()

def registrar_usuario(nome,email, senha):
        conn=conectar()
        c = conn.cursor()
        c.execute("INSERT INTO users (nome,email, senha) VALUES (?,?, ?)", (nome,email, senha))
        conn.commit()
        return True


def registrar_usuario_steam(nome,steam_id):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT or IGNORE INTO users (nome,steam_id)
        VALUES (?,?)
    """, (nome,steam_id))
    conn.commit()
    conn.close()

def buscar_id_usuario_steam(steam_id):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE steam_id = ?", (steam_id,))
    user = cursor.fetchone()
    return user 

def listar_usuarios_email(email):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    emailReturn = cursor.fetchone()
    conn.close()
    return emailReturn

def listar_usuarios_nome(nome):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE nome = ?", (nome,))
    emailReturn = cursor.fetchone()
    conn.close()
    return emailReturn

#print(listar_usuarios_nome('lilofox'))

def atualizar_usuario(id_usuario, nome=None, email=None, senha=None, bio=None, avatar_url=None):
    conn = conectar()
    cursor = conn.cursor()
    campos = []
    valores = []
    if nome: campos.append("nome = ?"); valores.append(nome)
    if email: campos.append("email = ?"); valores.append(email)
    if senha: campos.append("senha = ?"); valores.append(senha)
    if bio is not None: campos.append("bio = ?"); valores.append(bio)
    if avatar_url is not None: campos.append("avatar_url = ?"); valores.append(avatar_url)
    valores.append(id_usuario)
    cursor.execute(f"UPDATE users SET {', '.join(campos)} WHERE id = ?", valores)
    conn.commit()
    conn.close()

def deletar_usuario(id_usuario):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (id_usuario,))
    conn.commit()
    conn.close()

# ===================== GAMES =====================

def criar_jogo(nome, descricao='', genero='', plataforma='', desenvolvedor='', imagem_url='', lancamento=''):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO games (nome, descricao, genero, plataforma, desenvolvedor, imagem_url, lancamento)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (nome, descricao, genero, plataforma, desenvolvedor, imagem_url, lancamento))
    conn.commit()
    conn.close()

def listar_jogos():
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, genero, plataforma FROM games")
    jogos = cursor.fetchall()
    conn.close()
    return jogos

# ===================== USER_GAMES =====================

def criar_user_game(user_id, game_id, status, nota=None, comentario=None):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO user_games (user_id, game_id, status, nota, comentario)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, game_id, status, nota, comentario))
    conn.commit()
    conn.close()

def listar_user_games():
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, game_id, status, nota, comentario FROM user_games")
    user_games = cursor.fetchall()
    conn.close()
    return user_games

def atualizar_user_game(id_user_game, status=None, nota=None, comentario=None):
    conn = conectar()
    cursor = conn.cursor()
    campos = []
    valores = []
    if status: campos.append("status = ?"); valores.append(status)
    if nota is not None: campos.append("nota = ?"); valores.append(nota)
    if comentario is not None: campos.append("comentario = ?"); valores.append(comentario)
    valores.append(id_user_game)
    cursor.execute(f"UPDATE user_games SET {', '.join(campos)} WHERE id = ?", valores)
    conn.commit()
    conn.close()

def deletar_user_game(id_user_game):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_games WHERE id = ?", (id_user_game,))
    conn.commit()
    conn.close()

# ===================== Avaliacoes =====================

def inserir_avaliacao(user_id, nota, comentario, nome_jogo):
    conn = conectar()
    c = conn.cursor()
    c.execute("""
        INSERT INTO avaliacoes (user_id, nota, comentario, nome_jogo)
        VALUES (?, ?, ?, ?)
    """, (user_id, nota, comentario, nome_jogo))
    conn.commit()
    avaliacao_id = c.lastrowid
    conn.close()
    return avaliacao_id

def curtir_avaliacao(avaliacao_id):
    conn = conectar()
    c = conn.cursor()

    c.execute("""
        UPDATE avaliacoes
        SET likes = likes + 1
        WHERE avaliacao_id = ?
    """, (avaliacao_id,))

    conn.commit()
    conn.close()

def descurtir_avaliacao(avaliacao_id):
    conn = conectar()
    c = conn.cursor()

    c.execute("""
        UPDATE avaliacoes
        SET likes = likes - 1
        WHERE avaliacao_id = ?
    """, (avaliacao_id,))

    conn.commit()
    conn.close()


def listar_top_avaliacoes(limit=10):
    conn = conectar()
    c = conn.cursor()
    c.execute("""
        SELECT 
            a.nome_jogo, 
            a.likes, 
            a.avaliacao_id, 
            a.user_id, 
            a.nota, 
            a.comentario, 
            a.data_avaliacao,
            u.nome AS user_nome,
            u.avatar_url
        FROM avaliacoes a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.likes DESC
        LIMIT ?
    """, (limit,))
    resultados = c.fetchall()
    conn.close()
    return [
        {
            'nome_jogo': nome_jogo,
            'likes': likes,
            'avaliacao_id': avaliacao_id,
            'user_id': user_id,
            'nota': nota,
            'comentario': comentario,
            'data_avaliacao': data_avaliacao,
            'user_nome': user_nome,
            'avatar_url': avatar_url,
        }
        for nome_jogo, likes, avaliacao_id, user_id, nota, comentario, data_avaliacao, user_nome, avatar_url in resultados
    ]

def listar_reviews():
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, game_id, titulo, texto, nota FROM reviews")
    reviews = cursor.fetchall()
    conn.close()
    return reviews

def atualizar_review(id_review, titulo=None, texto=None, nota=None):
    conn = conectar()
    cursor = conn.cursor()
    campos = []
    valores = []
    if titulo is not None: campos.append("titulo = ?"); valores.append(titulo)
    if texto is not None: campos.append("texto = ?"); valores.append(texto)
    if nota is not None: campos.append("nota = ?"); valores.append(nota)
    valores.append(id_review)
    cursor.execute(f"UPDATE reviews SET {', '.join(campos)} WHERE id = ?", valores)
    conn.commit()
    conn.close()

def deletar_review(avaliacao_id):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM avaliacoes WHERE avaliacao_id = ?", (avaliacao_id,))
    conn.commit()
    conn.close()

# ===================== FOLLOWS =====================

def criar_follow(seguidor_id, seguindo_id):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO follows (seguidor_id, seguindo_id)
        VALUES (?, ?)
    """, (seguidor_id, seguindo_id))
    conn.commit()
    conn.close()

def listar_follows():
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT id, seguidor_id, seguindo_id FROM follows")
    follows = cursor.fetchall()
    conn.close()
    return follows

def deletar_follow(id_follow):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM follows WHERE id = ?", (id_follow,))
    conn.commit()
    conn.close()

# ===================== LISTS =====================

def criar_lista(user_id, nome, descricao=''):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO lists (user_id, nome, descricao)
        VALUES (?, ?, ?)
    """, (user_id, nome, descricao))
    conn.commit()
    conn.close()

def listar_listas():
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT id, user_id, nome, descricao FROM lists")
    listas = cursor.fetchall()
    conn.close()
    return listas

def atualizar_lista(id_lista, nome=None, descricao=None):
    conn = conectar()
    cursor = conn.cursor()
    campos = []
    valores = []
    if nome is not None: campos.append("nome = ?"); valores.append(nome)
    if descricao is not None: campos.append("descricao = ?"); valores.append(descricao)
    valores.append(id_lista)
    cursor.execute(f"UPDATE lists SET {', '.join(campos)} WHERE id = ?", valores)
    conn.commit()
    conn.close()

def deletar_lista(id_lista):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM lists WHERE id = ?", (id_lista,))
    conn.commit()
    conn.close()

# ===================== LIST_GAMES =====================

def adicionar_jogo_na_lista(list_id, game_id):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO list_games (list_id, game_id)
        VALUES (?, ?)
    """, (list_id, game_id))
    conn.commit()
    conn.close()

def listar_jogos_da_lista():
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("SELECT id, list_id, game_id FROM list_games")
    jogos = cursor.fetchall()
    conn.close()
    return jogos

def deletar_jogo_da_lista(id_list_game):
    conn = conectar()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM list_games WHERE id = ?", (id_list_game,))
    conn.commit()
    conn.close()



#comandos para criar as tables
def init_db():
        conn = conectar()
        c = conn.cursor()
        #c.execute("DROP TABLE users")
        c.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT,
                email TEXT UNIQUE,
                senha TEXT,
                avatar_url TEXT,
                created_at TEXT DEFAULT (date('now')),
                steam_id TEXT UNIQUE
            )
        """)
        conn.commit()

def review():
    conn = conectar()
    c = conn.cursor()

    c.execute(""" 
        CREATE TABLE IF NOT EXISTS avaliacoes (
            avaliacao_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INT,
            nota INT,
            comentario TEXT,
            nome_jogo TEXT,
            likes INTEGER DEFAULT 0,
            data_avaliacao TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES usuarios(user_id)
        )
    """)

    conn.commit()
    conn.close()

#curtir_avaliacao(1)
#curtir_avaliacao(2)
curtir_avaliacao(4)