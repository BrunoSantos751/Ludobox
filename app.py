from flask import Flask, redirect, request, session, url_for, render_template
import sqlite3
import requests
import re
from werkzeug.security import generate_password_hash, check_password_hash
from comandos_dados import listar_usuarios_email, registrar_usuario,registrar_usuario_steam

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta'

STEAM_API_KEY = '8C9877E691C84ED816FEF5D1B80A842B'
RETURN_URL = 'http://localhost:5000/authorize'


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
    email = request.form['email']
    password = request.form['password']
    user = listar_usuarios_email(email)

    if user and check_password_hash(user[3], password):
        session['email'] = email
        return f"<h2>Bem-vindo, {user[1]}!</h2><p>Login com email bem-sucedido.</p><a href='/logout'>Logout</a>"
    else:
        return "<p>Email ou senha incorretos.</p>"

@app.route('/register', methods=['POST'])
def register():
    nome = request.form['nome']
    email = request.form['email']
    password = request.form['password']
    hashed_password = generate_password_hash(password)
    success = registrar_usuario(nome,email, hashed_password)
    return "<p>Usuário registrado com sucesso!</p>" if success else "<p>Email já cadastrado.</p>"

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
