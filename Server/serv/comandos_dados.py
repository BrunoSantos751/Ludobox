# comandos_dados.py

from db import get_connection
from datetime import datetime

# ===================== AVALIAÇÕES =====================

def remover_avaliacao(avaliacao_id, user_id):
    # Incluímos user_id para garantir que apenas o dono da avaliação pode removê-la
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM avaliacoes WHERE avaliacao_id = %s AND user_id = %s", (avaliacao_id, user_id))
        conn.commit()
        # Verifica se alguma linha foi afetada para saber se a remoção ocorreu
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Erro ao remover avaliação: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def inserir_avaliacao(user_id, nota, comentario, nome_jogo):
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO avaliacoes (user_id, nota, comentario, nome_jogo) VALUES (%s, %s, %s, %s) RETURNING avaliacao_id",
              (user_id, nota, comentario, nome_jogo))
    avaliacao_id = c.fetchone()['avaliacao_id']
    conn.commit()
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

def buscar_avaliacoes_por_usuario(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM avaliacoes
        WHERE user_id = %s
        ORDER BY data_avaliacao DESC
    """, (user_id,))
    avaliacoes = cursor.fetchall()
    conn.close()
    return avaliacoes

def toggle_like_avaliacao(user_id, avaliacao_id):
    conn = get_connection()
    c = conn.cursor()

    # Verificar se o usuário já curtiu a avaliação na tabela user_evaluation_likes
    c.execute("SELECT COUNT(*) FROM user_evaluation_likes WHERE user_id = %s AND avaliacao_id = %s", (user_id, avaliacao_id))
    result = c.fetchone()
    # Adicionado verificação para garantir que 'result' não é None antes de acessar 'count'
    has_liked = result and result['count'] > 0

    if has_liked:
        # Se já curtiu, descurtir: remove da tabela user_evaluation_likes e decrementa likes em avaliacoes
        c.execute("DELETE FROM user_evaluation_likes WHERE user_id = %s AND avaliacao_id = %s", (user_id, avaliacao_id))
        c.execute("UPDATE avaliacoes SET likes = likes - 1 WHERE avaliacao_id = %s", (avaliacao_id,))
        message = "Avaliação descurtida com sucesso"
    else:
        # Se não curtiu, curtir: insere na tabela user_evaluation_likes e incrementa likes em avaliacoes
        c.execute("INSERT INTO user_evaluation_likes (user_id, avaliacao_id) VALUES (%s, %s)", (user_id, avaliacao_id))
        c.execute("UPDATE avaliacoes SET likes = likes + 1 WHERE avaliacao_id = %s", (avaliacao_id,))
        message = "Avaliação curtida com sucesso"

    conn.commit()
    conn.close()
    return message

# NOVA FUNÇÃO (para suportar a rota /api/user_likes no main.py)
def get_user_liked_evaluations(user_id):
    conn = get_connection()
    c = conn.cursor()
    # Busca IDs de avaliações que o usuário curtiu na tabela user_evaluation_likes
    c.execute("SELECT avaliacao_id FROM user_evaluation_likes WHERE user_id = %s", (user_id,))
    liked_ids_dicts = c.fetchall()
    conn.close()
    return [d['avaliacao_id'] for d in liked_ids_dicts]


# ===================== USERS =====================


def buscar_usuarios_por_nome(parte_nome):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        SELECT id, nome, avatar_url
        FROM users
        WHERE LOWER(nome) LIKE %s
        LIMIT 10
    """, (f'%{parte_nome.lower()}%',))
    usuarios = c.fetchall()
    conn.close()
    return usuarios

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


def registrar_usuario_steam(nome, steam_id, avatar_url=None):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (nome, steam_id, avatar_url)
            VALUES (%s, %s, %s)
            ON CONFLICT (steam_id) DO UPDATE SET
                nome = EXCLUDED.nome,
                avatar_url = EXCLUDED.avatar_url
        """, (nome, steam_id, avatar_url))
        conn.commit()
    except Exception as e:
        print(f"Erro ao registrar/atualizar usuário Steam: {e}")
        conn.rollback()
    finally:
        conn.close()

def buscar_id_usuario_steam(steam_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE steam_id = %s", (steam_id,))
    user_id = cursor.fetchone()
    conn.close()
    return user_id['id'] if user_id else None

def buscar_usuario_por_email(email):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = c.fetchone()
    conn.close()
    return user

def buscar_usuario_por_id(user_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, nome, email, bio, avatar_url FROM users WHERE id = %s", (user_id,))
    user = c.fetchone()
    conn.close()
    return user

def atualizar_usuario(user_id, nome, email, bio, avatar_url):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        UPDATE users
        SET nome = %s, email = %s, bio = %s, avatar_url = %s
        WHERE id = %s
    """, (nome, email, bio, avatar_url, user_id))
    conn.commit()
    conn.close()

# NOVA FUNÇÃO (para suportar a rota /api/users/<int:user_id>/profile no main.py)
# Esta é uma refatoração da função que faltava no main.py
def atualizar_bio_usuario(user_id, new_bio):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("UPDATE users SET bio = %s WHERE id = %s", (new_bio, user_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao atualizar bio do usuário {user_id}: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

# ===================== Jogos Favoritos =====================

def adicionar_jogo_favorito(user_id, game_id, game_name, game_image):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO jogos_favoritos (user_id, game_id, game_name, game_image)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, game_id) DO NOTHING
        """, (user_id, game_id, game_name, game_image))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Erro ao adicionar jogo favorito: {e}")
    finally:
        conn.close()

def remover_jogo_favorito(user_id, game_id):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM jogos_favoritos WHERE user_id = %s AND game_id = %s", (user_id, game_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Erro ao remover jogo favorito: {e}")
    finally:
        conn.close()

def listar_jogos_favoritos(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT game_id, game_name, game_image FROM jogos_favoritos WHERE user_id = %s", (user_id,))
    favoritos = cursor.fetchall()
    conn.close()
    return favoritos

def verificar_jogo_favorito(user_id, game_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM jogos_favoritos WHERE user_id = %s AND game_id = %s", (user_id, game_id))
    result = cursor.fetchone()
    conn.close()
    return result['count'] > 0


def remover_jogo_usuario(user_id, nome_jogo):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM user_games WHERE user_id = %s AND nome_jogo = %s", (user_id, nome_jogo))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao remover jogo do usuário: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def adicionar_ou_atualizar_jogo_usuario(user_id, nome_jogo, status):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM user_games WHERE user_id = %s AND nome_jogo = %s", (user_id, nome_jogo))
        exists = cursor.fetchone()['count'] > 0

        if exists:
            cursor.execute("UPDATE user_games SET status = %s WHERE user_id = %s AND nome_jogo = %s", (status, user_id, nome_jogo))
            message = "Status do jogo atualizado com sucesso"
        else:
            cursor.execute("INSERT INTO user_games (user_id, nome_jogo, status) VALUES (%s, %s, %s)", (user_id, nome_jogo, status))
            message = "Jogo adicionado com sucesso"
        conn.commit()
        return True, message
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()


def listar_jogos_do_usuario_com_status(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT nome_jogo, status FROM user_games WHERE user_id = %s", (user_id,))
    games = cursor.fetchall()
    conn.close()
    return games


def listar_avaliacoes_do_usuario(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT avaliacao_id, nome_jogo, nota, comentario, data_avaliacao
        FROM avaliacoes
        WHERE user_id = %s
        ORDER BY data_avaliacao DESC
    """, (user_id,))
    reviews = cursor.fetchall()
    conn.close()
    return reviews


# ===================== Follows =====================

def criar_follow(seguidor_id, seguindo_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO follows (seguidor_id, seguindo_id) VALUES (%s, %s)", (seguidor_id, seguindo_id))
    conn.commit()
    conn.close()

def listar_follows():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM follows")
    follows = c.fetchall()
    conn.close()
    return follows

def remover_follow(seguidor_id, seguindo_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM follows WHERE seguidor_id = %s AND seguindo_id = %s", (seguidor_id, seguindo_id))
    conn.commit()
    conn.close()

def verificar_follow(seguidor_id, seguindo_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM follows WHERE seguidor_id = %s AND seguindo_id = %s", (seguidor_id, seguindo_id))
    result = cursor.fetchone()
    conn.close()
    return result['count'] > 0

def listar_seguindo(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.nome, u.avatar_url
        FROM follows f
        JOIN users u ON f.seguindo_id = u.id
        WHERE f.seguidor_id = %s
    """, (user_id,))
    seguindo = cursor.fetchall()
    conn.close()
    return seguindo

def listar_seguidores(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.nome, u.avatar_url
        FROM follows f
        JOIN users u ON f.seguidor_id = u.id
        WHERE f.seguindo_id = %s
    """, (user_id,))
    seguidores = cursor.fetchall()
    conn.close()
    return seguidores