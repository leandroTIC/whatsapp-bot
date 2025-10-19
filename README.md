# 🤖 WhatsApp Bot com Node.js

Este é um bot para WhatsApp criado com [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), que oferece:

- Um **menu interativo automático** com múltiplas opções
- Encaminhamento para **atendimento humano**
- Retorno ao menu digitando `"menu"`
- Gerenciamento simples de estado por usuário

---

## 🚀 Funcionalidades

- Menu automático com opções como:
  - Ver horário de atendimento
  - Falar com atendente
  - Ver serviços, localização e mais
- Respostas automáticas com mensagens personalizadas
- Controle de fluxo: volta ao menu a qualquer momento com `"menu"`
- Encerramento manual do atendimento por parte do atendente

---

## 🛠 Tecnologias

- [Node.js](https://nodejs.org/)
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [qrcode-terminal](https://www.npmjs.com/package/qrcode-terminal)

---

## 🧩 Pré-requisitos

- Node.js instalado (v14 ou superior)
- WhatsApp com acesso ao QR Code
- Navegador instalado (Chromium via Puppeteer é usado internamente)

---

## 📦 Instalação

```bash
npm install
node main.js
