# Use a imagem oficial do Node.js
FROM node:18-alpine

# Definir o diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar arquivos de configuração
COPY tsconfig.json ./
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY components.json ./
COPY next-env.d.ts ./
COPY eslint.config.mjs ./

# Copiar o código fonte
COPY src ./src
COPY public ./public

# Expor a porta 3000
EXPOSE 3000

# Comando padrão para desenvolvimento
CMD ["npm", "run", "dev"]
