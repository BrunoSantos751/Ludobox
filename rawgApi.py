import requests
import os
from dotenv import load_dotenv

# carrega variáveis do .env
load_dotenv()
API_KEY = os.getenv('RAWG_API_KEY')
BASE_URL = 'https://api.rawg.io/api/games'

def obter_jogos(pagina=1, limite=10):
    params = {
        'key': API_KEY,
        'page': pagina,
        'page_size': limite
    }

    response = requests.get(BASE_URL, params=params)

    if response.status_code == 200:
        dados = response.json()
        nomes_maiusculo = [jogo['name'].upper() for jogo in dados.get('results', [])]
        return nomes_maiusculo
    else:
        print(f"Erro na API: {response.status_code}")
        return []

if __name__ == "__main__":
    jogos = obter_jogos()
    for nome in jogos:
        print(nome)
