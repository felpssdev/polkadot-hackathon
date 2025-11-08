# Use a imagem oficial do Node.js
FROM node:18-alpine

# Instalar pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

# Definir o diretório de trabalho
WORKDIR /app

# Copiar package.json e pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Instalar dependências com pnpm
RUN pnpm install --frozen-lockfile

# Copiar arquivos de configuração
COPY tsconfig.json ./
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY components.json ./
COPY eslint.config.mjs ./

# Copiar o código fonte
COPY src ./src
COPY public ./public

# Expor a porta 3000
EXPOSE 3000

# Comando padrão para desenvolvimento
CMD ["pnpm", "run", "dev"]
