# Migração para JWT Tokens - Documentação

Este documento explica as mudanças realizadas para migrar de autenticação baseada em cookies/sessões para JWT tokens.

## Mudanças Principais

### 1. Novo Módulo: `jwt_auth.py`

Criado um módulo dedicado para gerenciar autenticação JWT com as seguintes funções:

- `generate_token(user_id, user_name, logged_in_via)`: Gera um token JWT
- `verify_token(token)`: Verifica e decodifica um token JWT
- `get_token_from_request()`: Extrai o token do header Authorization
- `get_current_user()`: Obtém o usuário atual do token
- `@token_required`: Decorator para proteger rotas
- `@optional_token`: Decorator para rotas que podem funcionar com ou sem autenticação

### 2. Mudanças no `main.py`

#### Removido:
- Import de `session` do Flask
- Configurações de sessão (`app.secret_key`, `app.permanent_session_lifetime`, etc.)
- Uso de `session['user_id']`, `session['user_name']`, etc.

#### Adicionado:
- Import do módulo `jwt_auth`
- Decorators `@token_required` e `@optional_token` nas rotas protegidas
- Uso de `request.current_user` para acessar dados do usuário autenticado

### 3. Rotas Modificadas

#### Rotas de Autenticação:

**`/login_email` (POST)**
- **Antes**: Retornava apenas mensagem de sucesso, armazenava dados na sessão
- **Agora**: Retorna o token JWT no corpo da resposta junto com dados do usuário
```json
{
  "message": "Login bem-sucedido!",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "nome": "João",
    "email": "joao@example.com"
  }
}
```

**`/register` (POST)**
- **Antes**: Apenas registrava o usuário
- **Agora**: Registra e retorna token JWT automaticamente (login automático após registro)

**`/authorize` (GET)** - Login Steam
- **Antes**: Armazenava dados na sessão e redirecionava
- **Agora**: Gera token JWT e redireciona com token na URL
- Formato: `{FRONTEND_URL}?token={JWT_TOKEN}&login=steam`

**`/api/auth_status` (GET)**
- **Antes**: Verificava `session.get('user_id')`
- **Agora**: Usa `@optional_token` e verifica token JWT do header Authorization

**`/logout` (POST)**
- **Antes**: Limpava a sessão
- **Agora**: Apenas retorna sucesso (o frontend deve remover o token)

#### Rotas Protegidas (agora usam `@token_required`):

- `/avaliacoes` (POST)
- `/avaliacoes/toggle_like` (POST)
- `/api/user_likes` (GET)
- `/api/users/<user_id>/profile` (PATCH)
- `/api/users/<user_id>/games` (POST)
- `/api/users/<user_id>/games/<nome_jogo>` (DELETE)
- `/api/users/<user_id>/reviews/<review_id>` (DELETE)
- `/api/follow` (POST)
- `/api/unfollow` (POST)

## Como Usar no Frontend

### 1. Armazenar o Token

Após login/registro, armazene o token:
```javascript
// Exemplo com localStorage
localStorage.setItem('token', response.data.token);
```

### 2. Enviar o Token nas Requisições

Inclua o token no header `Authorization`:
```javascript
// Exemplo com Axios
axios.get('/api/protected', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### 3. Tratar Login Steam

Após redirecionamento do Steam, extraia o token da URL:
```javascript
// Exemplo de tratamento no frontend
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
if (token) {
  localStorage.setItem('token', token);
  // Limpar URL
  window.history.replaceState({}, document.title, window.location.pathname);
}
```

### 4. Verificar Autenticação

Use a rota `/api/auth_status`:
```javascript
axios.get('/api/auth_status', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(response => {
  if (response.data.logged_in) {
    // Usuário autenticado
    const user = response.data;
  }
});
```

### 5. Logout

Remova o token do storage:
```javascript
localStorage.removeItem('token');
// Opcionalmente, chamar a rota /logout
```

## Configuração

### Variável de Ambiente

Adicione `SECRET_KEY` no arquivo `conexao.env`:
```env
SECRET_KEY=sua_chave_secreta_super_segura_aqui
```

**IMPORTANTE**: Use uma chave forte e única em produção!

### CORS

O CORS foi atualizado para não depender de cookies:
```python
CORS(app, origins=['https://trabalho-engenharia-de-software-phi.vercel.app', 'http://localhost:5173', 'http://localhost:3000'])
```

## Vantagens da Migração

1. **Stateless**: Não precisa armazenar estado no servidor
2. **Escalabilidade**: Funciona melhor com múltiplos servidores
3. **Mobile-friendly**: Tokens funcionam melhor em apps mobile
4. **CORS simplificado**: Não precisa de `supports_credentials=True`
5. **Flexibilidade**: Token pode ser usado em diferentes domínios

## Segurança

- Tokens expiram em 7 dias (configurável em `jwt_auth.py`)
- Tokens são assinados com HMAC-SHA256
- Validação de token em todas as rotas protegidas
- Verificação de autorização (usuário só pode modificar seus próprios dados)

## Troubleshooting

### Erro: "Token de autenticação não fornecido"
- Verifique se o header `Authorization` está sendo enviado
- Formato correto: `Authorization: Bearer <token>`

### Erro: "Token inválido ou expirado"
- Token pode ter expirado (7 dias)
- Token pode estar corrompido
- Solução: Fazer login novamente

### Erro: "Não autorizado"
- Usuário está tentando modificar dados de outro usuário
- Verifique se o `user_id` do token corresponde ao `user_id` da rota

## Próximos Passos (Opcional)

1. **Refresh Tokens**: Implementar sistema de refresh tokens para renovação automática
2. **Token Blacklist**: Implementar blacklist para invalidar tokens em logout
3. **Rate Limiting**: Adicionar rate limiting baseado em token
4. **Token Rotation**: Rotacionar tokens periodicamente

