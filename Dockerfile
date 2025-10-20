# Usa Node.js oficial
FROM node:22-bullseye

# Define diretório de trabalho
WORKDIR /usr/src/app

# Copia package.json e package-lock.json primeiro para otimizar cache
COPY package*.json ./

# Instala dependências
RUN npm install --legacy-peer-deps

# Instala dependências do Puppeteer (bibliotecas necessárias para Chromium)
RUN apt-get update && apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libdrm2 \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copia todo o código
COPY . .

# Expõe porta se necessário (ex: para health check)
EXPOSE 3000

# Comando para iniciar o bot
CMD ["node", "main.js"]
