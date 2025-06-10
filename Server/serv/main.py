from flask import Flask, redirect, request, session, url_for, render_template, jsonify
import sqlite3
import requests
import re
from werkzeug.security import generate_password_hash, check_password_hash
from comandos_dados import *
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app, origins='*')
app.secret_key = 'Ludobox'
RAWG_API_KEY = '7221b0332ccb4921ad5eb4f3da1bddbb'


STEAM_API_KEY = '8C9877E691C84ED816FEF5D1B80A842B'
RETURN_URL = 'http://localhost:8080/authorize'


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    steam_openid_url = (
        "https://steamcommunity.com/openid/login"
        "?openid.ns=http://specs.openid.net/auth/2.0"
        "&openid.mode=checkid_setup"
        f"&openid.return_to={RETURN_URL}"
        "&openid.realm=http://localhost:5000/"
        "&openid.identity=http://specs.openid.net/auth/2.0/identifier_select"
        "&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select"
    )
    return redirect(steam_openid_url)

@app.route('/authorize')
def authorize():
    openid_url = request.args.get('openid.claimed_id')
    if not openid_url:
        return 'Erro: URL inválida.'

    steam_id_match = re.search(r'/openid/id/(\d+)', openid_url)
    if steam_id_match:
        steam_id = steam_id_match.group(1)
        session['steam_id'] = steam_id
    else:
        return 'Erro ao extrair Steam ID.'
    

    profile_url = f"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={STEAM_API_KEY}&steamids={steam_id}"
    response = requests.get(profile_url)

    try:
        player = response.json()['response']['players'][0]
    except Exception as e:
        return f"Erro ao buscar perfil da Steam: {e}<br><br>Resposta:<br>{response.text}"
    registrar_usuario_steam(player['personaname'],steam_id)
    return f"""
        <h2>Bem-vindo, {player['personaname']}!</h2>
        <img src="{player['avatarfull']}"><br>
        <p>SteamID: {steam_id}</p>
        <p><a href="{player['profileurl']}" target="_blank">Ver perfil</a></p>
        <a href="/logout">Logout</a>
    """

@app.route('/login_email', methods=['POST'])
def login_email():
    data = request.get_json()  
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email e senha são obrigatórios."}), 400

    user = listar_usuarios_email(email) # type: ignore

    if user and check_password_hash(user[3], password): # type: ignore
        session['user_id'] = user[0] # type: ignore
        session['user_name'] = user[1] # type: ignore
        return jsonify({"message": "Login bem-sucedido!", "user": {"id": user[0], "nome": user[1]}}), 200 # type: ignore
    else:
        return jsonify({"message": "Email ou senha incorretos."}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()  # Pega o JSON enviado
    
    nome = data.get('nome')
    email = data.get('email')
    password = data.get('password')
    
    if not nome or not email or not password:
        return jsonify({"message": "Dados incompletos."}), 400
    
    hashed_password = generate_password_hash(password)
    success = registrar_usuario(nome, email, hashed_password)
    
    if success:
        return jsonify({"message": "Usuário registrado com sucesso!"})
    else:
        return jsonify({"message": "Email já cadastrado."}), 400
    


@app.route('/api/games', methods=['GET'])

def get_games():
    query = request.args.get('search', '')  # parâmetro opcional: ?search=zelda
    ordering = request.args.get('ordering', '')  # rating, name, released, etc
    genres = request.args.get('genres', '')

    rawg_url = f'https://api.rawg.io/api/games?key={RAWG_API_KEY}&page_size=5'

    if query:
        rawg_url += f'&search={query}'
    if ordering:
        rawg_url += f'&ordering={ordering}'  # -rating (decrescente), name (crescente), etc
    if genres:
        rawg_url += f'&genres={genres}'  # IDs ou nomes

    try:
        response = requests.get(rawg_url)
        response.raise_for_status()
        data = response.json()

        games = [
            {
                'id': game['id'],
                'name': game['name'],
                'released': game.get('released'),
                'background_image': game.get('background_image'),
                'rating': game.get('rating'),
                'metacritic': game.get('metacritic')
            }
            for game in data.get('results', [])
            if game.get('rating') is not None
        ]

        return jsonify(games)

    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/avaliacoes', methods=['POST'])
def enviar_avaliacao():
    data = request.json
    user_id = data.get('user_id')
    nota = data.get('nota')
    comentario = data.get('comentario')
    nome_jogo = data.get('nome_jogo')

    if not all([user_id, nota, comentario, nome_jogo]):
        return jsonify({'erro': 'Dados incompletos'}), 400

    avaliacao_id = inserir_avaliacao(user_id, nota, comentario, nome_jogo)
    return jsonify({'mensagem': 'Avaliação enviada com sucesso', 'avaliacao_id': avaliacao_id}), 201

@app.route('/avaliacoes/like', methods=['POST'])
def curtir():
    data = request.json
    avaliacao_id = data.get('avaliacao_id')

    if not avaliacao_id:
        return jsonify({'erro': 'avaliacao_id é obrigatório'}), 400

    curtir_avaliacao(avaliacao_id)
    return jsonify({'mensagem': f'Curtida adicionada à avaliação {avaliacao_id}'}), 200

@app.route('/avaliacoes/dislike', methods=['POST'])
def descurtir():
    data = request.json
    avaliacao_id = data.get('avaliacao_id')

    if not avaliacao_id:
        return jsonify({'erro': 'avaliacao_id é obrigatório'}), 400

    descurtir_avaliacao(avaliacao_id)
    return jsonify({'mensagem': f'Curtida removida da avaliação {avaliacao_id}'}), 200

@app.route('/avaliacoes/top', methods=['GET'])
def top_jogos():
    top = listar_top_avaliacoes()
    return jsonify(top), 200




@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, port=8080)
