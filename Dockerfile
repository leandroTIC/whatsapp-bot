# Usa Node oficial
FROM node:22

# Cria pasta da aplicação
WORKDIR /usr/src/app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todo o restante do código
COPY . .

# Cria variável para Puppeteer não baixar Chromium (mais leve)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Expõe porta (opcional, seu bot não precisa necessariamente)
EXPOSE 3000

# Comando de start
CMD ["node", "main.js"]
