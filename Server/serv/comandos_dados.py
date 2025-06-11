from db import get_connection
from datetime import datetime

# ===================== USERS =====================

def criar_usuario(nome, email, senha, bio='', avatar_url=''):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (nome, email, senha, bio, avatar_url)
        VALUES (%s, %s, %s, %s, %s)
    """, (nome, email, senha, bio, avatar_url))
    conn.commit()
    conn.close()

def registrar_usuario(nome, email, senha):
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO users (nome, email, senha) VALUES (%s, %s, %s)", (nome, email, senha))
    conn.commit()
    conn.close()
    return True

def registrar_usuario_steam(nome, steam_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (nome, steam_id)
        VALUES (%s, %s)
        ON CONFLICT (steam_id) DO NOTHING
    """, (nome, steam_id))
    conn.commit()
    conn.close()

def buscar_id_usuario_steam(steam_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE steam_id = %s", (steam_id,))
    user = cursor.fetchone()
    conn.close()
    return user

def listar_usuarios_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    emailReturn = cursor.fetchone()
    conn.close()
    return emailReturn

def listar_usuarios_nome(nome):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE nome = %s", (nome,))
    emailReturn = cursor.fetchone()
    conn.close()
    return emailReturn

def atualizar_usuario(id_usuario, nome=None, email=None, senha=None, bio=None, avatar_url=None):
    conn = get_connection()
    cursor = conn.cursor()
    campos = []
    valores = []
    if nome: campos.append("nome = %s"); valores.append(nome)
    if email: campos.append("email = %s"); valores.append(email)
    if senha: campos.append("senha = %s"); valores.append(senha)
    if bio is not None: campos.append("bio = %s"); valores.append(bio)
    if avatar_url is not None: campos.append("avatar_url = %s"); valores.append(avatar_url)
    valores.append(id_usuario)
    cursor.execute(f"UPDATE users SET {', '.join(campos)} WHERE id = %s", valores)
    conn.commit()
    conn.close()

def deletar_usuario(id_usuario):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (id_usuario,))
    conn.commit()
    conn.close()

# ===================== USER_GAMES =====================

def registrar_jogo(user_id, nome_jogo, status):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO user_games (user_id, nome_jogo, status) VALUES (%s, %s, %s)",
                  (user_id, nome_jogo, status))
        conn.commit()
        return True
    except:
        return False

def alterar_status_jogo(user_id, nome_jogo, novo_status):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("UPDATE user_games SET status = %s WHERE user_id = %s AND nome_jogo = %s",
                  (novo_status, user_id, nome_jogo))
        conn.commit()
        return c.rowcount > 0
    except:
        return False

def listar_jogos_do_usuario(user_id):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("SELECT nome_jogo, status FROM user_games WHERE user_id = %s", (user_id,))
        jogos = c.fetchall()
        return jogos
    except:
        return []

# ===================== Avaliacoes =====================

def inserir_avaliacao(user_id, nota, comentario, nome_jogo):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        INSERT INTO avaliacoes (user_id, nota, comentario, nome_jogo)
        VALUES (%s, %s, %s, %s)
    """, (user_id, nota, comentario, nome_jogo))
    conn.commit()
    c.execute("SELECT LASTVAL()")
    avaliacao_id = c.fetchone()['lastval']
    conn.close()
    return avaliacao_id

def curtir_avaliacao(avaliacao_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE avaliacoes SET likes = likes + 1 WHERE avaliacao_id = %s", (avaliacao_id,))
    conn.commit()
    conn.close()

def descurtir_avaliacao(avaliacao_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE avaliacoes SET likes = likes - 1 WHERE avaliacao_id = %s", (avaliacao_id,))
    conn.commit()
    conn.close()

def listar_top_avaliacoes(limit=10):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        SELECT 
            a.nome_jogo, a.likes, a.avaliacao_id, a.user_id, 
            a.nota, a.comentario, a.data_avaliacao,
            u.nome AS user_nome, u.avatar_url
        FROM avaliacoes a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.likes DESC
        LIMIT %s
    """, (limit,))
    resultados = c.fetchall()
    conn.close()
    return resultados

# ===================== Follows =====================

def criar_follow(seguidor_id, seguindo_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO follows (seguidor_id, seguindo_id) VALUES (%s, %s)", (seguidor_id, seguindo_id))
    conn.commit()
    conn.close()

def listar_follows():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, seguidor_id, seguindo_id FROM follows")
    follows = cursor.fetchall()
    conn.close()
    return follows

def deletar_follow(id_follow):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM follows WHERE id = %s", (id_follow,))
    conn.commit()
    conn.close()
