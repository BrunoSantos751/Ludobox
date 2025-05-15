class Usuario:
    def __init__(self, nome):
        self.set_nome(nome)
        self._jogos_favoritos = []
        self._todos_jogos = []

    
    def get_nome(self):
        return self._nome

    def get_jogos_favoritos(self):
        return list(self._jogos_favoritos)

    def get_todos_jogos(self):
        return list(self._todos_jogos)

    
    def set_nome(self, nome):
        if isinstance(nome, str) and nome.strip():
            self._nome = nome.strip()

    def set_jogos_favoritos(self, jogos):
        if isinstance(jogos, list) and all(isinstance(j, str) for j in jogos):
            self._jogos_favoritos = list(set(jogos).intersection(self._todos_jogos))

    def set_todos_jogos(self, jogos):
        if isinstance(jogos, list) and all(isinstance(j, str) for j in jogos):
            self._todos_jogos = list(set(jogos))
            
            self._jogos_favoritos = [j for j in self._jogos_favoritos if j in self._todos_jogos]

    
    def adicionar_jogo(self, jogo):
        if isinstance(jogo, str) and jogo not in self._todos_jogos:
            self._todos_jogos.append(jogo)

    def remover_jogo(self, jogo):
        if jogo in self._todos_jogos:
            self._todos_jogos.remove(jogo)
        if jogo in self._jogos_favoritos:
            self._jogos_favoritos.remove(jogo)

    
    def adicionar_jogo_favorito(self, jogo):
        if jogo not in self._todos_jogos:
            self._todos_jogos.append(jogo)
        if jogo not in self._jogos_favoritos:
            self._jogos_favoritos.append(jogo)

    def remover_jogo_favorito(self, jogo):
        if jogo in self._jogos_favoritos:
            self._jogos_favoritos.remove(jogo)

   
    def buscar_jogo(self, jogo):
        return jogo in self._todos_jogos

    def buscar_jogo_favorito(self, jogo):
        return jogo in self._jogos_favoritos
