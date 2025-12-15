"""
Módulo de autenticação JWT para o Ludobox
Gerencia criação, validação e decodificação de tokens JWT
"""

import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="conexao.env")

# Chave secreta para assinar os tokens (use uma chave forte em produção)
SECRET_KEY = os.getenv("SECRET_KEY", "ludobox_secret_key_change_in_production")
ALGORITHM = "HS256"
TOKEN_EXPIRATION_HOURS = 24 * 7  # 7 dias

def generate_token(user_id, user_name, logged_in_via='email'):
    """
    Gera um token JWT para o usuário
    
    Args:
        user_id: ID do usuário
        user_name: Nome do usuário
        logged_in_via: Método de login ('email' ou 'steam')
    
    Returns:
        str: Token JWT codificado
    """
    payload = {
        'user_id': user_id,
        'user_name': user_name,
        'logged_in_via': logged_in_via,
        'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_token(token):
    """
    Verifica e decodifica um token JWT
    
    Args:
        token: Token JWT a ser verificado
    
    Returns:
        dict: Payload do token se válido, None se inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_token_from_request():
    """
    Extrai o token JWT dos cookies (prioridade) ou do header Authorization
    """
    # 1. Tenta pegar dos cookies (Novo padrão)
    token = request.cookies.get('token')
    if token:
        return token

    # 2. Fallback para o header Authorization (Caso precise testar via Postman sem cookies)
    auth_header = request.headers.get('Authorization')
    if auth_header:
        try:
            return auth_header.split(' ')[1]
        except IndexError:
            return None
    
    return None

def get_current_user():
    """
    Obtém o usuário atual a partir do token JWT na requisição
    
    Returns:
        dict: Dados do usuário (user_id, user_name, logged_in_via) ou None
    """
    token = get_token_from_request()
    
    if not token:
        return None
    
    payload = verify_token(token)
    return payload

def token_required(f):
    """
    Decorator para proteger rotas que requerem autenticação
    
    Uso:
        @app.route('/api/protected')
        @token_required
        def protected_route():
            user_id = request.current_user['user_id']
            ...
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        
        if not token:
            return jsonify({'message': 'Token de autenticação não fornecido', 'error': 'UNAUTHORIZED'}), 401
        
        payload = verify_token(token)
        
        if not payload:
            return jsonify({'message': 'Token inválido ou expirado', 'error': 'INVALID_TOKEN'}), 401
        
        # Adiciona os dados do usuário ao request para uso na rota
        request.current_user = payload
        
        return f(*args, **kwargs)
    
    return decorated

def optional_token(f):
    """
    Decorator para rotas que podem funcionar com ou sem autenticação
    
    Se houver um token válido, adiciona request.current_user
    Se não houver token ou for inválido, request.current_user será None
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        
        if token:
            payload = verify_token(token)
            if payload:
                request.current_user = payload
            else:
                request.current_user = None
        else:
            request.current_user = None
        
        return f(*args, **kwargs)
    
    return decorated

