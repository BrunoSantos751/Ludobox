# 🎮 LUDOBOX - Plataforma Social de Jogos

**LUDOBOX** é uma rede social dedicada a gamers, inspirada no conceito do *Letterboxd*. A plataforma permite aos utilizadores criar um perfil personalizado, catalogar a sua biblioteca de jogos, escrever críticas e interagir com uma comunidade de jogadores.

O projeto utiliza a **API da RAWG** para obter dados atualizados sobre milhares de jogos e oferece integração com a **Steam** para autenticação e importação de dados de perfil.

## 🧩 Funcionalidades Principais

  * **Autenticação Híbrida:** Login via e-mail/senha ou através da conta **Steam** (OpenID).
  * **Gestão de Biblioteca:** Classificação de jogos em três categorias:
      * 🕹️ *A Jogar*
      * ✅ *Terminado* (Zerado)
      * g *Abandonado*
  * **Sistema de Avaliação:** Atribuição de notas e criação de críticas escritas (reviews).
  * **Interação Social:**
      * Seguir e deixar de seguir outros utilizadores.
      * Sistema de "Gosto" (Like/Dislike) em avaliações.
      * Visualização de seguidores e utilizadores seguidos.
  * **Exploração:** Pesquisa e filtragem de jogos por género, popularidade e lançamentos (via RAWG API).
  * **Perfil Personalizado:** Bio editável, avatar (importado da Steam ou padrão) e histórico de atividades.

## 🚀 Tecnologias Utilizadas

### Backend (Server)

  * **Python 3**
  * **Flask** (Framework Web)
  * **PostgreSQL** (Base de dados)
  * **PyJWT** (Autenticação via JSON Web Tokens)
  * **Psycopg2** (Conector de base de dados)

### Frontend (Client)

  * **React 19**
  * **Vite** (Build tool rápida)
  * **HTML5 / CSS3**
  * **React Router** (Navegação SPA)

### APIs Externas

  * **RAWG Video Games Database API** (Metadados dos jogos)
  * **Steam Web API** (Autenticação e dados de utilizador)

-----

## 🛠️ Instalação e Configuração

Para executar este projeto localmente, siga os passos abaixo para o Backend e Frontend.

### Pré-requisitos

  * Python 3.8+
  * Node.js e npm
  * PostgreSQL instalado e a correr

### 1\. Configurar o Backend

1.  Navegue até à pasta do servidor:

    ```bash
    cd Server/serv
    ```

2.  Crie um ambiente virtual (recomendado):

    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  Instale as dependências:

    ```bash
    pip install -r requirements.txt
    ```

4.  Configure a Base de Dados:

      * Certifique-se que o PostgreSQL está ativo.
      * Execute o script de criação das tabelas (via `create_database.sql` ou executando os comandos Python correspondentes no `comandos_dados.py` / `setup_database.py`).

5.  Execute o servidor:

    ```bash
    python app.py
    ```

    *O servidor iniciará em `http://localhost:8080`*

### 2\. Configurar o Frontend

1.  Navegue até à pasta do frontend (num novo terminal):

    ```bash
    cd frontend
    ```

2.  Instale as dependências do Node:

    ```bash
    npm install
    ```

3.  Inicie o servidor de desenvolvimento:

    ```bash
    npm run dev
    ```

    *A aplicação estará disponível no endereço indicado pelo Vite (geralmente `http://localhost:5173`).*

-----

## ⚙️ Variáveis de Ambiente

Para segurança, recomenda-se criar um ficheiro `.env` na pasta `Server/serv` (o projeto atual tem as chaves no código, mas para produção devem ser ocultadas). As chaves necessárias são:

  * `RAWG_API_KEY`: A sua chave da API RAWG.
  * `STEAM_API_KEY`: A sua chave da API Steam.
  * `SECRET_KEY`: Chave secreta para assinatura de sessões/JWT.
  * `DATABASE_URL`: String de conexão ao PostgreSQL.

## 👨‍💻 Equipa de Desenvolvimento

  * [Fabio Reis](https://github.com/Fabioo082)
  * [Bruno Santos](https://github.com/BrunoSantos751)
  * [Ephrem Matheus](https://github.com/ephremmatheus)
  * [João Honorio](https://github.com/joaohonorio12)

-----

**Nota:** Este projeto foi desenvolvido com fins académicos/educativos.
