# Usar a imagem base do Node.js
FROM node:latest

# Definir o diretório de trabalho
WORKDIR /app

# Copia o package.json e package-lock.json para o container
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Expõe a porta que o app usa (se necessário)
EXPOSE 3000

# Comando para rodar o bot
CMD ["npm", "start"]