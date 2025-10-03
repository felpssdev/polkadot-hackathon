# Use a imagem oficial do Node.js
FROM node:18-alpine

# Definir o diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o código fonte
COPY . .

# Expor a porta 3000
EXPOSE 3000

# Comando padrão para desenvolvimento
CMD ["npm", "run", "dev"]
