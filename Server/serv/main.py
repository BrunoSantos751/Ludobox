from flask import Flask, redirect, request, session, url_for, render_template, jsonify
# import sqlite3  <-- REMOVER ESTA LINHA
import requests
import re
from werkzeug.security import generate_password_hash, check_password_hash
from comandos_dados import * # Importa todas as funções de interação com o DB
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:5173'])
app.secret_key = 'Ludobox'
RAWG_API_KEY = '7221b0332ccb4921ad5eb4f3da1bddbb'

STEAM_API_KEY = '8C9877E691C84ED816FEF5D1B80A842B'
RETURN_URL = 'http://localhost:8080/authorize'
FRONTEND_URL = 'http://localhost:5173'

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
        "&openid.realm=http://localhost:8080/"
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
        player_profile_url = f"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={STEAM_API_KEY}&steamids={steam_id}"
        player_response = requests.get(player_profile_url)
        player_data = player_response.json()['response']['players'][0]
        
        # Estas funções já interagem com o PostgreSQL via db.py
        registrar_usuario_steam(player_data['personaname'],steam_id)
        user_id = buscar_id_usuario_steam(steam_id)
        if user_id:
            # user_id vindo do banco de dados (provavelmente um dicionário)
            # user_id['id'] é o correto se estiver usando RealDictCursor
            session['user_id'] = user_id['id'] 
            session['user_name'] = player_data['personaname']
            session['logged_in_via'] = 'steam'
    else:
        return 'Erro ao extrair Steam ID.'
    
    return redirect(FRONTEND_URL)

@app.route('/login_email', methods=['POST'])
def login_email():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email e senha são obrigatórios."}), 400

  
    user = listar_usuarios_email(email)


    if user and check_password_hash(user['senha'], password):
        session['user_id'] = user['id'] # user[0] era o ID
        session['user_name'] = user['nome'] # user[1] era o nome
        session['logged_in_via'] = 'email'
        return jsonify({"message": "Login bem-sucedido!", "user": {"id": user['id'], "nome": user['nome']}}), 200
    else:
        return jsonify({"message": "Email ou senha incorretos."}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    nome = data.get('nome')
    email = data.get('email')
    password = data.get('password')
    
    if not nome or not email or not password:
        return jsonify({"message": "Dados incompletos."}), 400
    
    hashed_password = generate_password_hash(password)
    
  
    existing_user = listar_usuarios_email(email)
    if existing_user:
        return jsonify({"message": "Email já cadastrado."}), 400

  
    success = registrar_usuario(nome, email, hashed_password)
    
    if success:
        return jsonify({"message": "Usuário registrado com sucesso!"}), 201
    else:
        return jsonify({"message": "Erro ao registrar usuário."}), 500
    
@app.route('/api/auth_status', methods=['GET'])
def auth_status():
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'user_name': session.get('user_name'),
            'logged_in_via': session.get('logged_in_via')
        })
    return jsonify({'logged_in': False})

@app.route('/api/games', methods=['GET'])
def get_games():
<<<<<<< HEAD
    query = request.args.get('search', '')
    ordering = request.args.get('ordering', '')
    genres = request.args.get('genres', '')
    page_size = int(request.args.get('page_size', 12))
    page = int(request.args.get('page', 1))
=======
    query = request.args.get('search', '')  # ?search=zelda
    ordering = request.args.get('ordering', '')  # ?ordering=-rating
    genres = request.args.get('genres', '')  # ?genres=action
    page = request.args.get('page', '1')  # ?page=2
    page_size = request.args.get('page_size', '5')  # ?page_size=12
>>>>>>> main

    rawg_url = f'https://api.rawg.io/api/games?key={RAWG_API_KEY}&page_size={page_size}&page={page}'

    if query:
        rawg_url += f'&search={query}'
    if ordering:
        rawg_url += f'&ordering={ordering}'
    if genres:
        rawg_url += f'&genres={genres}'

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

        return jsonify({
            'results': games,
            'next': data.get('next'),
            'previous': data.get('previous'),
            'count': data.get('count')
        })

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
    return jsonify({'message': 'Logout efetuado com sucesso.'})

if __name__ == '__main__':
<<<<<<< HEAD
    app.run(debug=True, port=8080)
=======
    app.run(debug=True, port=8080)






    
>>>>>>> main
