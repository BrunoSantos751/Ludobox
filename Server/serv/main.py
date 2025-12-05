from flask import Flask, redirect, request, jsonify
import requests
import re
from urllib.parse import quote as encodeURIComponent
from werkzeug.security import generate_password_hash, check_password_hash
from comandos_dados import * # Importa todas as funções de interação com o DB
from flask_cors import CORS
from urllib.parse import unquote
import traceback
from jwt_auth import generate_token, token_required, optional_token, get_current_user

app = Flask(__name__)
# Configuração de CORS para permitir requisições do frontend
CORS(app, origins=['*'], supports_credentials=True)      



RAWG_API_KEY = '7221b0332ccb4921ad5eb4f3da1bddbb' 
STEAM_API_KEY = '8D3606789A4D5453D6977CEDC0C10AD8' 
RETURN_URL = 'http://localhost:8080/authorize'
FRONTEND_URL = 'http://localhost:5173/authorize'

@app.route('/')
def index():
    return redirect(FRONTEND_URL)

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
        return 'Erro: URL inválida.', 400

    steam_id_match = re.search(r'/openid/id/(\d+)', openid_url)
    if steam_id_match:
        steam_id = steam_id_match.group(1)
        player_profile_url = f"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={STEAM_API_KEY}&steamids={steam_id}"
        player_response = requests.get(player_profile_url)
        player_data = player_response.json()['response']['players'][0]
        
        # Adicionar o avatar_url e passá-lo para a função de registro
        avatar_url = player_data.get('avatarfull') # Usando o avatar completo
        
        # Registrar ou atualizar usuário Steam
        registrar_usuario_steam(player_data['personaname'], steam_id, avatar_url)
        user_id = buscar_id_usuario_steam(steam_id)
        
        if user_id:
            # Gerar token JWT
            token = generate_token(user_id, player_data['personaname'], 'steam')
            
            # Redirecionar para o frontend com o token na URL (ou usar outro método)
            # Opção 1: Passar token na URL (menos seguro, mas funciona para OAuth)
            return redirect(f"{FRONTEND_URL}?token={token}&login=steam")
        else:
            return 'Erro ao obter ID do usuário.', 500
    else:
        return 'Erro ao extrair Steam ID.', 400


@app.route('/login_email', methods=['POST'])
def login_email():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        print("Login por email falhou: Email e senha são obrigatórios.")
        return jsonify({"message": "Email e senha são obrigatórios."}), 400

    user = buscar_usuario_por_email(email)

    if user and check_password_hash(user['senha'], password):
        # Gerar token JWT
        token = generate_token(user['id'], user['nome'], 'email')
        print(f"Login por email bem-sucedido: user_id={user['id']}, user_name={user['nome']}")
        return jsonify({
            "message": "Login bem-sucedido!",
            "token": token,
            "user": {
                "id": user['id'],
                "nome": user['nome'],
                "email": user.get('email'),
                "avatar_url": user.get('avatar_url')
            }
        }), 200
    else:
        print("Tentativa de login por email falhou: Email ou senha incorretos.")
        return jsonify({"message": "Email ou senha incorretos."}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    nome = data.get('nome')
    email = data.get('email')
    password = data.get('password')
    
    if not nome or not email or not password:
        print("Registro falhou: Dados incompletos.")
        return jsonify({"message": "Dados incompletos."}), 400
    
    hashed_password = generate_password_hash(password)
    
    existing_user = buscar_usuario_por_email(email)
    if existing_user:
        print(f"Registro falhou: Email {email} já cadastrado.")
        return jsonify({"message": "Email já cadastrado."}), 400

    success = registrar_usuario(nome, email, hashed_password)
    
    if success:
        # Buscar o usuário recém-criado para obter o ID
        new_user = buscar_usuario_por_email(email)
        if new_user:
            # Gerar token JWT automaticamente após registro
            token = generate_token(new_user['id'], new_user['nome'], 'email')
            print(f"Usuário {nome} registrado com sucesso!")
            return jsonify({
                "message": "Usuário registrado com sucesso!",
                "token": token,
                "user": {
                    "id": new_user['id'],
                    "nome": new_user['nome'],
                    "email": new_user.get('email')
                }
            }), 201
        else:
            return jsonify({"message": "Usuário registrado, mas erro ao gerar token."}), 201
    else:
        print("Erro ao registrar usuário.")
        return jsonify({"message": "Erro ao registrar usuário."}), 500

@app.route('/api/auth_status', methods=['GET'])
@optional_token
def auth_status():
    user = get_current_user()
    
    if user:
        print(f"Status de autenticação: Logado como user_id={user['user_id']}, user_name={user['user_name']}")
        return jsonify({
            'logged_in': True,
            'user_id': user['user_id'],
            'user_name': user['user_name'],
            'logged_in_via': user.get('logged_in_via', 'email')
        })
    
    print("Status de autenticação: Não logado (token não fornecido ou inválido).")
    return jsonify({'logged_in': False})

@app.route('/api/games', methods=['GET'])
def get_games():
    query = request.args.get('search', '')
    ordering = request.args.get('ordering', '')
    genres = request.args.get('genres', '')
    page = request.args.get('page', '1')
    page_size = request.args.get('page_size', '5')

    rawg_url = f'https://api.rawg.io/api/games?key={RAWG_API_KEY}&page_size={page_size}&page={page}'

    if query:
        rawg_url += f'&search={encodeURIComponent(query)}'
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
            if game.get('rating') is not None # Filtra jogos sem rating se necessário
        ]

        return jsonify({
            'results': games,
            'next': data.get('next'),
            'previous': data.get('previous'),
            'count': data.get('count')
        }), 200
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar dados RAWG: {e}") # Debugging
        return jsonify({'error': str(e)}), 500

@app.route('/avaliacoes', methods=['POST'])
@token_required
def enviar_avaliacao():
    # Obter user_id do token JWT
    user_id = request.current_user['user_id']
    
    data = request.json
    nota = data.get('nota')
    comentario = data.get('comentario')
    nome_jogo = data.get('nome_jogo')

    if not all([nota, comentario, nome_jogo]):
        print("Erro ao enviar avaliação: Dados incompletos.")
        return jsonify({'erro': 'Dados incompletos'}), 400

    avaliacao_id = inserir_avaliacao(user_id, nota, comentario, nome_jogo)
    print(f"Avaliação {avaliacao_id} enviada com sucesso pelo usuário {user_id}.")
    return jsonify({'mensagem': 'Avaliação enviada com sucesso', 'avaliacao_id': avaliacao_id}), 201


@app.route('/avaliacoes/like', methods=['POST'])
def curtir_avaliacao_route():
    data = request.json
    avaliacao_id = data.get('avaliacao_id')
    if not avaliacao_id:
        print("Erro: avaliacao_id é obrigatório para curtir.") # Debugging
        return jsonify({'erro': 'avaliacao_id é obrigatório'}), 400
    curtir_avaliacao(avaliacao_id)
    print(f"Curtida adicionada à avaliação {avaliacao_id}.") # Debugging
    return jsonify({'mensagem': f'Curtida adicionada à avaliação {avaliacao_id}'}), 200

@app.route('/avaliacoes/dislike', methods=['POST'])
def descurtir_avaliacao_route():
    data = request.json
    avaliacao_id = data.get('avaliacao_id')
    if not avaliacao_id:
        print("Erro: avaliacao_id é obrigatório para descurtir.") # Debugging
        return jsonify({'erro': 'avaliacao_id é obrigatório'}), 400
    descurtir_avaliacao(avaliacao_id)
    print(f"Curtida removida da avaliação {avaliacao_id}.") # Debugging
    return jsonify({'mensagem': f'Curtida removida da avaliação {avaliacao_id}'}), 200


@app.route('/avaliacoes/toggle_like', methods=['POST'])
@token_required
def toggle_avaliacao_like_route():
    # Obter user_id do token JWT
    user_id = request.current_user['user_id']
    
    data = request.json
    avaliacao_id = data.get('avaliacao_id')

    if not avaliacao_id:
        print("Erro ao alternar like: ID da avaliação é obrigatório.")
        return jsonify({'erro': 'ID da avaliação é obrigatório'}), 400

    try:
        avaliacao_id_int = int(avaliacao_id)
        user_id_int = int(user_id)
        mensagem = toggle_like_avaliacao(user_id_int, avaliacao_id_int)
        print(f"Alternar like para avaliacao_id={avaliacao_id_int}, user_id={user_id_int}: {mensagem}")
        return jsonify({'mensagem': mensagem}), 200
    except Exception as e:
        print(f"Erro ao alternar like no main.py: {e}")
        return jsonify({'erro': f'Erro interno ao processar o like/unlike: {e}'}), 500

@app.route('/api/user_likes', methods=['GET'])
@token_required
def get_user_likes_route():
    # Obter user_id do token JWT
    user_id = request.current_user['user_id']
    
    try:
        user_id_int = int(user_id)
        liked_ids = get_user_liked_evaluations(user_id_int)
        print(f"Likes do usuário {user_id_int} obtidos: {liked_ids}")
        return jsonify([{"avaliacao_id": aid} for aid in liked_ids]), 200
    except Exception as e:
        print(f"Erro ao buscar likes do usuário no main.py: {e}")
        return jsonify({'erro': f'Erro interno ao buscar likes do usuário: {e}'}), 500


@app.route('/avaliacoes/top', methods=['GET'])
def top_avaliacoes_route():
    avaliacoes = listar_top_avaliacoes()
    avaliacoes_com_imagens = []
    for avaliacao in avaliacoes:
        game_name = avaliacao['nome_jogo']
        rawg_url = f'https://api.rawg.io/api/games?key={RAWG_API_KEY}&search={encodeURIComponent(game_name)}&page_size=1'
        try:
            response = requests.get(rawg_url)
            response.raise_for_status()
            game_details = response.json().get('results')
            if game_details and len(game_details) > 0:
                avaliacao['background_image'] = game_details[0].get('background_image')
                avaliacao['rating'] = game_details[0].get('rating')
                avaliacao['metacritic'] = game_details[0].get('metacritic')
            else:
                avaliacao['background_image'] = None
                avaliacao['rating'] = None
                avaliacao['metacritic'] = None
        except requests.exceptions.RequestException as e:
            print(f"Erro ao buscar imagem para {game_name}: {e}") # Debugging
            avaliacao['background_image'] = None
            avaliacao['rating'] = None
            avaliacao['metacritic'] = None
        avaliacoes_com_imagens.append(avaliacao)
    print(f"Retornando {len(avaliacoes_com_imagens)} avaliações com imagens.") # Debugging
    return jsonify(avaliacoes_com_imagens), 200


@app.route('/logout', methods=['POST'])
@optional_token
def logout():
    print("Logout solicitado.")
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

# --- ROTAS PARA PERFIL ---

@app.route('/api/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile(user_id):
    user_data = buscar_usuario_por_id(user_id) # Usar o user_id diretamente do argumento da rota
    if user_data:
        print(f"Perfil do usuário {user_id} obtido do DB: Nome={user_data.get('nome')}, Bio={user_data.get('bio')}.") # DEBUG
        return jsonify({
            'id': user_data['id'],
            'nome': user_data['nome'],
            'email': user_data['email'],
            'bio': user_data.get('bio', ''),
            'avatar_url': user_data.get('avatar_url', None)
        }), 200
    print(f"Usuário {user_id} não encontrado no DB.") # Debugging
    return jsonify({'message': 'Usuário não encontrado'}), 404

@app.route('/api/users/<int:user_id>/profile', methods=['PATCH'])
@token_required
def update_user_profile(user_id):
    # Obter user_id do token JWT
    current_user_id = request.current_user['user_id']
    
    print(f"[{request.method}] /api/users/{user_id}/profile - Início da requisição.")

    data = request.json
    new_bio = data.get('bio')

    if new_bio is None:
        print(f"[{request.method}] /api/users/{user_id}/profile - Erro: Campo bio é obrigatório.")
        return jsonify({'message': 'Campo bio é obrigatório'}), 400
    
    # Validação de autorização: verifica se o user_id do token corresponde ao user_id da rota
    if current_user_id != user_id:
        print(f"[{request.method}] /api/users/{user_id}/profile - Tentativa de atualização de perfil NÃO AUTORIZADA. User do token: {current_user_id}")
        return jsonify({'message': 'Não autorizado a editar este perfil'}), 403

    success = atualizar_bio_usuario(user_id, new_bio)
    if success:
        print(f"[{request.method}] /api/users/{user_id}/profile - Bio do usuário {user_id} atualizada com sucesso.")
        return jsonify({'message': 'Bio atualizada com sucesso'}), 200
    print(f"[{request.method}] /api/users/{user_id}/profile - Erro ao atualizar bio do usuário {user_id}.")
    return jsonify({'message': 'Erro ao atualizar bio'}), 500

@app.route('/api/users/<int:user_id>/games', methods=['POST'])
@token_required
def add_user_game(user_id):
    # Obter user_id do token JWT
    current_user_id = request.current_user['user_id']
    
    print(f"[{request.method}] /api/users/{user_id}/games - Início da requisição.")

    data = request.json
    nome_jogo = data.get('nome_jogo')
    status = data.get('status')

    if not all([nome_jogo, status]):
        print(f"[{request.method}] /api/users/{user_id}/games - Erro: Nome do jogo e status são obrigatórios.")
        return jsonify({'message': 'Nome do jogo e status são obrigatórios'}), 400

    valid_statuses = ['jogando', 'zerado', 'abandonado']
    if status not in valid_statuses:
        print(f"[{request.method}] /api/users/{user_id}/games - Erro: Status inválido '{status}'.")
        return jsonify({'message': 'Status inválido. Use "jogando", "zerado" ou "abandonado".'}), 400

    # Validação de autorização: verifica se o user_id do token corresponde ao user_id da rota
    if current_user_id != user_id:
        print(f"[{request.method}] /api/users/{user_id}/games - Tentativa não autorizada de adicionar jogo. User do token: {current_user_id}")
        return jsonify({'message': 'Não autorizado a adicionar jogos a este perfil'}), 403

    success, message = adicionar_ou_atualizar_jogo_usuario(user_id, nome_jogo, status)
    if success:
        print(f"[{request.method}] /api/users/{user_id}/games - Jogo '{nome_jogo}' para usuário {user_id}: {message}")
        return jsonify({'message': message}), 201 if "adicionado" in message else 200
    print(f"[{request.method}] /api/users/{user_id}/games - Erro ao adicionar/atualizar jogo para user {user_id}: {message}")
    return jsonify({'message': f'Erro: {message}'}), 500

@app.route('/api/users/<int:user_id>/games_by_status', methods=['GET'])
def get_user_games_by_status_route(user_id): # Renomear user_id_from_route para user_id
    user_games_data = listar_jogos_do_usuario_com_status(user_id) # Use user_id diretamente

    games_by_status = {
        'jogando': [],
        'zerado': [],
        'abandonado': []
    }

    for game_record in user_games_data:
        game_name = game_record['nome_jogo']
        game_status = game_record['status']

        rawg_url = f'https://api.rawg.io/api/games?key={RAWG_API_KEY}&search={encodeURIComponent(game_name)}&page_size=1'
        try:
            response = requests.get(rawg_url)
            response.raise_for_status()
            game_details = response.json().get('results')

            game_info = {'name': game_name, 'background_image': None}
            if game_details and len(game_details) > 0:
                first_game = game_details[0]
                game_info = {
                    'id': first_game['id'],
                    'name': first_game['name'],
                    'background_image': first_game.get('background_image'),
                    'rating': first_game.get('rating'),
                    'metacritic': first_game.get('metacritic')
                }

            if game_status == 'jogando':
                games_by_status['jogando'].append(game_info)
            elif game_status == 'zerado':
                games_by_status['zerado'].append(game_info)
            elif game_status == 'abandonado':
                games_by_status['abandonado'].append(game_info)

        except requests.exceptions.RequestException as e:
            print(f"Erro ao buscar dados RAWG para {game_name}: {e}") # Debugging
            game_info = {'name': game_name, 'background_image': None}
            if game_status == 'jogando':
                games_by_status['jogando'].append(game_info)
            elif game_status == 'zerado':
                games_by_status['zerado'].append(game_info)
            elif game_status == 'abandonado':
                games_by_status['abandonado'].append(game_info)
    print(f"Jogos do usuário {user_id} por status obtidos.") # Debugging
    return jsonify(games_by_status), 200

@app.route('/api/users/<int:user_id>/reviews', methods=['GET'])
def get_user_reviews_route(user_id): # Renomear user_id_from_route para user_id
    user_reviews_data = listar_avaliacoes_do_usuario(user_id) # Use user_id diretamente

    reviews_with_game_info = []
    for review_record in user_reviews_data:
        game_name = review_record['nome_jogo']
        rawg_url = f'https://api.rawg.io/api/games?key={RAWG_API_KEY}&search={encodeURIComponent(game_name)}'

        background_image = None
        try:
            response = requests.get(rawg_url)
            response.raise_for_status()
            game_details = response.json().get('results')

            if game_details and len(game_details) > 0:
                found_image = None
                for game in game_details:
                    if game['name'].lower() == game_name.lower():
                        found_image = game.get('background_image')
                        break
                if not found_image and game_details[0]:
                    found_image = game_details[0].get('background_image')
                background_image = found_image

        except requests.exceptions.RequestException as e:
            print(f"Erro ao buscar dados RAWG para o jogo da avaliação {game_name}: {e}") # Debugging

        review_info = {
            'id': review_record['avaliacao_id'],
            'nome_jogo': review_record['nome_jogo'],
            'nota': review_record['nota'],
            'comentario': review_record['comentario'],
            'data_avaliacao': review_record['data_avaliacao'].isoformat(),
            'background_image': background_image
        }
        reviews_with_game_info.append(review_info)
    print(f"Avaliações do usuário {user_id} obtidas.") # Debugging
    return jsonify(reviews_with_game_info), 200

@app.route('/api/users/<int:user_id>/seguindo', methods=['GET'])
def get_seguindo(user_id):
    seguindo = listar_seguindo(user_id)
    return jsonify(seguindo), 200

@app.route('/api/users/<int:user_id>/seguidores', methods=['GET'])
def get_seguidores(user_id):
    seguidores = listar_seguidores(user_id)
    return jsonify(seguidores), 200

@app.route('/api/follow', methods=['POST'])
@token_required
def follow_user():
    # Obter user_id do token JWT
    seguidor_id = request.current_user['user_id']
    
    data = request.get_json()
    seguindo_id = data.get('seguindo_id')
    
    if not seguindo_id:
        return jsonify({'message': 'ID do usuário a seguir é obrigatório'}), 400
    
    if seguidor_id == seguindo_id:
        return jsonify({'message': 'Você não pode seguir a si mesmo'}), 400
    
    criar_follow(seguidor_id, seguindo_id)
    return jsonify({'message': 'Agora você está seguindo esse usuário'}), 200

@app.route('/api/users/search')
def search_users():
    query = request.args.get('query')
    if not query:
        return jsonify([]), 200
    usuarios = buscar_usuarios_por_nome(query)
    return jsonify(usuarios), 200


@app.route('/api/users/<int:user_id>/games/<string:nome_jogo>', methods=['DELETE'])
@token_required
def remove_user_game(user_id, nome_jogo):
    # Obter user_id do token JWT
    current_user_id = request.current_user['user_id']
    
    if current_user_id != user_id:
        return jsonify({'message': 'Não autorizado a remover este jogo.'}), 403

    # Decodifica o nome do jogo, se ele vier encodado na URL
    decoded_nome_jogo = unquote(nome_jogo)

    if remover_jogo_usuario(user_id, decoded_nome_jogo):
        return jsonify({'message': f'Jogo "{decoded_nome_jogo}" removido com sucesso.'}), 200
    else:
        return jsonify({'message': f'Falha ao remover jogo "{decoded_nome_jogo}".'}), 500


@app.route('/api/users/<int:user_id>/reviews/<int:review_id>', methods=['DELETE'])
@token_required
def remove_user_review(user_id, review_id):
    # Obter user_id do token JWT
    current_user_id = request.current_user['user_id']
    
    print(f"DEBUG: Tentativa de remover avaliação {review_id} pelo user_id da URL: {user_id}. User_id do token: {current_user_id}")
    if current_user_id != user_id:
        return jsonify({'message': 'Não autorizado a remover esta avaliação.'}), 403

    if remover_avaliacao(review_id, user_id):
        return jsonify({'message': 'Avaliação removida com sucesso.'}), 200
    else:
        return jsonify({'message': 'Falha ao remover avaliação ou avaliação não encontrada.'}), 500
    

@app.route('/api/unfollow', methods=['POST'])
@token_required
def unfollow_user():
    # Obter user_id do token JWT
    seguidor_id = request.current_user['user_id']
    
    data = request.get_json()
    seguindo_id = data.get('seguindo_id')

    if not seguindo_id:
        return jsonify({'message': 'ID do usuário a deixar de seguir é obrigatório'}), 400

    if remover_follow(seguidor_id, seguindo_id):
        return jsonify({'message': 'Deixou de seguir com sucesso.'}), 200
    else:
        # Retorna 404 se o follow não foi encontrado (talvez já não estivesse seguindo)
        return jsonify({'message': 'Falha ao deixar de seguir ou follow não encontrado.'}), 404




if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8080) 