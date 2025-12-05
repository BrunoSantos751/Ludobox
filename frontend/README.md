# React + Vite - Ludobox Frontend

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Configuration de Ambiente (Environment Configuration)

### Configurar a URL da API

1. Crie um arquivo `.env.local` na raiz do projeto (frontend/)
2. Copie o conteúdo de `.env.example`
3. Altere a URL conforme necessário:

```env
VITE_API_BASE_URL=https://seu-servidor.com
```

**Importante:** O arquivo `.env.local` não deve ser enviado ao repositório (já está no `.gitignore`).

### Desenvolvimento Local

Para usar um servidor local durante desenvolvimento:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
