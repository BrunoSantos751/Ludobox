from flask import Flask, redirect, request, session, url_for, render_template, jsonify
import requests
import re
from urllib.parse import quote as encodeURIComponent
from werkzeug.security import generate_password_hash, check_password_hash
from comandos_dados import * # Importa todas as funções de interação com o DB
from flask_cors import CORS
from datetime import timedelta, datetime, timezone
from urllib.parse import unquote
import jwt



app = Flask(__name__)
# Configuração de CORS para permitir requisições do frontend
CORS(app, supports_credentials=True, origins=['https://trabalho-engenharia-de-software-phi.vercel.app'])
app.secret_key = 'Ludobox' # Mantenha esta chave secreta e forte em produção

# Configuração para sessões permanentes
app.permanent_session_lifetime = timedelta(days=7) # Exemplo: sessão dura 7 dias
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  
app.config['SESSION_COOKIE_SECURE'] = True      



RAWG_API_KEY = '7221b0332ccb4921ad5eb4f3da1bddbb' 
STEAM_API_KEY = '6A3A0276105A093B07C6CF6FC5FEFB2F' 
RETURN_URL = 'https://ludobox.onrender.com/authorize'
FRONTEND_URL = 'https://trabalho-engenharia-de-software-phi.vercel.app/'

@app.route('/')
def index():
    return redirect(FRONTEND_URL)



@app.route('/authorize')
def authorize():
    if request.args.get('openid.mode') == 'id_res':
        # Reconstruir a URL de verificação
        params = dict(request.args)
        params['openid.mode'] = 'check_authentication'
        if 'openid.response_nonce' in params:
            del params['openid.response_nonce']

        # Fazendo uma requisição POST para o endpoint de verificação do Steam
        response = requests.post("https://steamcommunity.com/openid/login", data=params)

        if "is_valid:true" in response.text:
            steam_id_full_url = request.args.get('openid.claimed_id')
            # Extrai apenas o ID numérico do Steam
            steam_id_match = re.search(r'steamcommunity\.com/openid/id/(\d+)', steam_id_full_url)
            if steam_id_match:
                steam_id = steam_id_match.group(1)
                user = buscar_id_usuario_steam(steam_id)
                user_name = unquote(request.args.get('openid.ext1.value.personaname', '')) # Nome da persona do Steam

                if not user:
                    # Se o usuário não existe, adicione-o ao DB
                    user_id = registrar_usuario_steam(steam_id, user_name)
                    print(f"Novo usuário Steam adicionado: {user_name} ({steam_id})")
                else:
                    user_id = user['id']


                # Configura a sessão do Flask (ainda é bom para o backend ter, mesmo com o JWT)
                session['user_id'] = user_id
                session['user_name'] = user_name
                session['logged_in_via'] = 'steam'
                session['steam_id'] = steam_id
                session.permanent = True
                session.modified = True

                print(f"Login Steam bem-sucedido para user_id: {user_id}, user_name: {user_name}")

                # --- AQUI ESTÁ A LÓGICA DO TOKEN TEMPORÁRIO (JWT) ---
                expiration_time = datetime.now(timezone.utc) + timedelta(seconds=60) # Token válido por 60 segundos
                temp_token_payload = {
                    'user_id': user_id,
                    'exp': expiration_time.timestamp(), # Tempo de expiração em timestamp Unix
                    'iat': datetime.now(timezone.utc).timestamp() # Tempo de emissão em timestamp Unix
                }
                # Codifica o token JWT usando a JWT_SECRET_KEY e o algoritmo HS256
                temp_auth_token = jwt.encode(temp_token_payload, JWT_SECRET_KEY, algorithm='HS256')

                # Redireciona para o FRONTEND_URL com o token como parâmetro de consulta
                print(f"Redirecionando para {FRONTEND_URL}?auth_token={temp_auth_token}")
                return redirect(f"{FRONTEND_URL}?auth_token={temp_auth_token}")
            else:
                print(f"Erro: Não foi possível extrair Steam ID de {steam_id_full_url}")
                return redirect(FRONTEND_URL + '?login_error=invalid_steam_id')
        else:
            print("Verificação OpenID falhou.")
            return redirect(FRONTEND_URL + '?login_error=steam_verification_failed')
    elif request.args.get('openid.mode') == 'cancel':
        print("Login Steam cancelado pelo usuário.")
        return redirect(FRONTEND_URL + '?login_error=steam_cancelled')
    else:
        print("Requisição OpenID inválida.")
        return redirect(FRONTEND_URL + '?login_error=invalid_openid_request')

@app.route('/login_email', methods=['POST'])
def login_email():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        print("Login por email falhou: Email e senha são obrigatórios.") # Debugging
        return jsonify({"message": "Email e senha são obrigatórios."}), 400

    user = buscar_usuario_por_email(email)

    if user and check_password_hash(user['senha'], password):
        session['user_id'] = user['id']
        session['user_name'] = user['nome']
        session['logged_in_via'] = 'email'
        session.permanent = True # Torna a sessão permanente
        session.modified = True 
        print(f"Login por email bem-sucedido (após email login): user_id={session.get('user_id')}, user_name={session.get('user_name')}") # DEBUG CRÍTICO
        return jsonify({"message": "Login bem-sucedido!", "user": {"id": user['id'], "nome": user['nome']}}), 200
    else:
        print("Tentativa de login por email falhou: Email ou senha incorretos.") # Debugging
        return jsonify({"message": "Email ou senha incorretos."}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    nome = data.get('nome')
    email = data.get('email')
    password = data.get('password')
    
    if not nome or not email or not password:
        print("Registro falhou: Dados incompletos.") # Debugging
        return jsonify({"message": "Dados incompletos."}), 400
    
    hashed_password = generate_password_hash(password)
    
    existing_user = buscar_usuario_por_email(email)
    if existing_user:
        print(f"Registro falhou: Email {email} já cadastrado.") # Debugging
        return jsonify({"message": "Email já cadastrado."}), 400

    success = registrar_usuario(nome, email, hashed_password)
    
    if success:
        print(f"Usuário {nome} registrado com sucesso!") # Debugging
        return jsonify({"message": "Usuário registrado com sucesso!"}), 201
    else:
        print("Erro ao registrar usuário.") # Debugging
        return jsonify({"message": "Erro ao registrar usuário."}), 500

@app.route('/api/auth_status', methods=['GET'])
def auth_status():
    print(f"Rota /api/auth_status acessada. Sessão atual: user_id={session.get('user_id')}, user_name={session.get('user_name')}") # DEBUG CRÍTICO
    if 'user_id' in session:
        print(f"Status de autenticação: Logado como user_id={session.get('user_id')}, user_name={session.get('user_name')}") # Debugging
        return jsonify({
            'logged_in': True,
            'user_id': session.get('user_id'),
            'user_name': session.get('user_name'),
            'logged_in_via': session.get('logged_in_via')
        })
    print("Status de autenticação: Não logado (user_id não encontrado na sessão).") # Debugging
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
def enviar_avaliacao():
    data = request.json
    user_id = data.get('user_id')
    nota = data.get('nota')
    comentario = data.get('comentario')
    nome_jogo = data.get('nome_jogo')

    if not all([user_id, nota, comentario, nome_jogo]):
        print("Erro ao enviar avaliação: Dados incompletos.") # Debugging
        return jsonify({'erro': 'Dados incompletos'}), 400

    avaliacao_id = inserir_avaliacao(user_id, nota, comentario, nome_jogo)
    print(f"Avaliação {avaliacao_id} enviada com sucesso.") # Debugging
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
def toggle_avaliacao_like_route():
    data = request.json
    avaliacao_id = data.get('avaliacao_id')
    user_id = data.get('user_id')

    if not all([avaliacao_id, user_id]):
        print("Erro ao alternar like: ID da avaliação e ID do usuário são obrigatórios.") # Debugging
        return jsonify({'erro': 'ID da avaliação e ID do usuário são obrigatórios'}), 400

    try:
        avaliacao_id_int = int(avaliacao_id)
        user_id_int = int(user_id)
        mensagem = toggle_like_avaliacao(user_id_int, avaliacao_id_int)
        print(f"Alternar like para avaliacao_id={avaliacao_id_int}, user_id={user_id_int}: {mensagem}") # Debugging
        return jsonify({'mensagem': mensagem}), 200
    except Exception as e:
        print(f"Erro ao alternar like no main.py: {e}") # Debugging
        return jsonify({'erro': f'Erro interno ao processar o like/unlike: {e}'}), 500

@app.route('/api/user_likes', methods=['GET'])
def get_user_likes_route():
    user_id = request.args.get('user_id')
    if not user_id:
        print("Erro ao buscar likes do usuário: ID do usuário é obrigatório.") # Debugging
        return jsonify({'erro': 'ID do usuário é obrigatório'}), 400
    try:
        user_id_int = int(user_id)
        liked_ids = get_user_liked_evaluations(user_id_int)
        print(f"Likes do usuário {user_id_int} obtidos: {liked_ids}") # Debugging
        return jsonify([{"avaliacao_id": aid} for aid in liked_ids]), 200
    except Exception as e:
        print(f"Erro ao buscar likes do usuário no main.py: {e}") # Debugging
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


@app.route('/logout', methods=['POST']) # Mudado para POST, como está no seu App.jsx
def logout():
    print(f"Logout iniciado. Antes de limpar a sessão: user_id={session.get('user_id')}, user_name={session.get('user_name')}") # DEBUG CRÍTICO
    session.clear()
    print("Sessão limpa no logout.") # Debugging
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
def update_user_profile(user_id): # Renomear user_id_from_route para user_id diretamente
    # Adicionando logs detalhados para depuração da sessão
    print(f"[{request.method}] /api/users/{user_id}/profile - Início da requisição.")
    print(f"Conteúdo da sessão no início da requisição: {dict(session)}") # DEBUG CRÍTICO

    data = request.json
    new_bio = data.get('bio')

    if new_bio is None:
        print(f"[{request.method}] /api/users/{user_id}/profile - Erro: Campo bio é obrigatório.") # Debugging
        return jsonify({'message': 'Campo bio é obrigatório'}), 400
    
    # Validação de autorização: verifica se o user_id da sessão corresponde ao user_id da rota
    if session.get('user_id') != user_id: # Use user_id diretamente, já é o int da rota
        print(f"[{request.method}] /api/users/{user_id}/profile - Tentativa de atualização de perfil NÃO AUTORIZADA. User da sessão: {session.get('user_id')}") # Debugging
        return jsonify({'message': 'Não autorizado a editar este perfil'}), 403

    success = atualizar_bio_usuario(user_id, new_bio) # Use user_id diretamente
    if success:
        print(f"[{request.method}] /api/users/{user_id}/profile - Bio do usuário {user_id} atualizada com sucesso.") # Debugging
        return jsonify({'message': 'Bio atualizada com sucesso'}), 200
    print(f"[{request.method}] /api/users/{user_id}/profile - Erro ao atualizar bio do usuário {user_id}.") # Debugging
    return jsonify({'message': 'Erro ao atualizar bio'}), 500

@app.route('/api/users/<int:user_id>/games', methods=['POST'])
def add_user_game(user_id): # Renomear user_id_from_route para user_id diretamente
    # Adicionando logs detalhados para depuração da sessão
    print(f"[{request.method}] /api/users/{user_id}/games - Início da requisição.")
    print(f"Conteúdo da sessão no início da requisição: {dict(session)}") # DEBUG CRÍTICO

    data = request.json
    nome_jogo = data.get('nome_jogo')
    status = data.get('status')

    if not all([nome_jogo, status]):
        print(f"[{request.method}] /api/users/{user_id}/games - Erro: Nome do jogo e status são obrigatórios.") # Debugging
        return jsonify({'message': 'Nome do jogo e status são obrigatórios'}), 400

    valid_statuses = ['jogando', 'zerado', 'abandonado']
    if status not in valid_statuses:
        print(f"[{request.method}] /api/users/{user_id}/games - Erro: Status inválido '{status}'.") # Debugging
        return jsonify({'message': 'Status inválido. Use "jogando", "zerado" ou "abandonado".'}), 400

    # Validação de autorização: verifica se o user_id da sessão corresponde ao user_id da rota
    if session.get('user_id') != user_id: # Use user_id diretamente
        print(f"[{request.method}] /api/users/{user_id}/games - Tentativa não autorizada de adicionar jogo. User da sessão: {session.get('user_id')}") # Debugging
        return jsonify({'message': 'Não autorizado a adicionar jogos a este perfil'}), 403

    success, message = adicionar_ou_atualizar_jogo_usuario(user_id, nome_jogo, status) # Use user_id diretamente
    if success:
        print(f"[{request.method}] /api/users/{user_id}/games - Jogo '{nome_jogo}' para usuário {user_id}: {message}") # Debugging
        return jsonify({'message': message}), 201 if "adicionado" in message else 200
    print(f"[{request.method}] /api/users/{user_id}/games - Erro ao adicionar/atualizar jogo para user {user_id}: {message}") # Debugging
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
def follow_user():
    data = request.get_json()
    seguidor_id = data.get('seguidor_id')
    seguindo_id = data.get('seguindo_id')
    if not all([seguidor_id, seguindo_id]):
        return jsonify({'message': 'IDs obrigatórios'}), 400
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
def remove_user_game(user_id, nome_jogo):
    # Nota: Usamos session.get('user_id') para segurança, para garantir que apenas
    # o usuário logado possa remover seus próprios jogos.
    current_user_id = session.get('user_id')
    if not current_user_id or current_user_id != user_id:
        return jsonify({'message': 'Não autorizado a remover este jogo.'}), 403

    # Decodifica o nome do jogo, se ele vier encodado na URL
    decoded_nome_jogo = unquote(nome_jogo)

    if remover_jogo_usuario(user_id, decoded_nome_jogo):
        return jsonify({'message': f'Jogo "{decoded_nome_jogo}" removido com sucesso.'}), 200
    else:
        return jsonify({'message': f'Falha ao remover jogo "{decoded_nome_jogo}".'}), 500


@app.route('/api/users/<int:user_id>/reviews/<int:review_id>', methods=['DELETE'])
def remove_user_review(user_id, review_id):
    current_user_id = session.get('user_id')
    print(f"DEBUG: Tentativa de remover avaliação {review_id} pelo user_id da URL: {user_id}. User_id na sessão: {current_user_id}") # Adicione esta linha
    if not current_user_id or current_user_id != user_id:
        return jsonify({'message': 'Não autorizado a remover esta avaliação.'}), 403

    if remover_avaliacao(review_id, user_id):
        return jsonify({'message': 'Avaliação removida com sucesso.'}), 200
    else:
        return jsonify({'message': 'Falha ao remover avaliação ou avaliação não encontrada.'}), 500
    

@app.route('/api/unfollow', methods=['POST'])
def unfollow_user():
    data = request.get_json()
    seguidor_id = data.get('seguidor_id')
    seguindo_id = data.get('seguindo_id')

    if not all([seguidor_id, seguindo_id]):
        return jsonify({'message': 'IDs de seguidor e seguido são obrigatórios'}), 400

    # Certifique-se de que o usuário logado (seguidor_id) é quem está fazendo a requisição
    current_user_id = session.get('user_id')
    if not current_user_id or current_user_id != seguidor_id:
        return jsonify({'message': 'Não autorizado a deixar de seguir esta pessoa.'}), 403

    if remover_follow(seguidor_id, seguindo_id):
        return jsonify({'message': 'Deixou de seguir com sucesso.'}), 200
    else:
        # Retorna 404 se o follow não foi encontrado (talvez já não estivesse seguindo)
        return jsonify({'message': 'Falha ao deixar de seguir ou follow não encontrado.'}), 404

@app.route('/api/exchange_token', methods=['POST'])
def exchange_token():
    data = request.get_json()
    temp_auth_token = data.get('token')

    if not temp_auth_token:
        return jsonify({'message': 'Token não fornecido'}), 400

    try:
        # Decodifique e verifique o token usando a JWT_SECRET_KEY
        decoded_token = jwt.decode(temp_auth_token, JWT_SECRET_KEY, algorithms=['HS256'])
        user_id = decoded_token.get('user_id')

        if not user_id:
            return jsonify({'message': 'Token inválido: user_id ausente'}), 400

        user = buscar_usuario_por_id(user_id)
        if not user:
            return jsonify({'message': 'Usuário não encontrado'}), 404

        # Agora, defina a sessão do Flask como de costume
        session['user_id'] = user['id']
        session['user_name'] = user['nome_usuario']
        session['logged_in_via'] = 'steam' # Ou 'jwt_steam' se quiser diferenciar
        if 'steam_id' in user and user['steam_id']: # Certifique-se que seu objeto 'user' do DB tem 'steam_id'
             session['steam_id'] = user['steam_id']
        session.permanent = True
        session.modified = True

        return jsonify({
            'message': 'Sessão estabelecida com sucesso',
            'isLoggedIn': True,
            'userName': user['nome_usuario'],
            'userId': user['id']
        }), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Token inválido'}), 401
    except Exception as e:
        print(f"Erro interno ao trocar o token: {e}")
        return jsonify({'message': 'Erro interno ao processar o token'}),


if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=8080) 
