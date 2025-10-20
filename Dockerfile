# Usar Node 22 com base Debian slim
FROM node:22-bullseye-slim

# Diretório da aplicação
WORKDIR /usr/src/app

# Instalar dependências do Chromium necessárias
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk1.0-0 \
    libcups2 \
    libx11-xcb1 \
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
    libdrm2 \
    libgbm1 \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar todo o código da aplicação
COPY . .

# Definir variáveis de ambiente Puppeteer (opcional mas recomendado)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false \
    PUPPETEER_EXECUTABLE_PATH=""

# Comando para rodar o bot
CMD ["node", "main.js"]
