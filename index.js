import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import express from 'express'
import QRCode from 'qrcode'
import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express()
const PORT = process.env.PORT || 10000
const app = express();
const PORT = process.env.PORT || 10000;

let sock // socket global
let sock;       // conexão com o WhatsApp
let lastQR = null; // guarda o QR gerado para exibir no navegador

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
// 🔸 Garante que a pasta de autenticação existe
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER);
  console.log('📁 Pasta "auth" criada para armazenar credenciais.');
}

// 🟢 Rota para exibir o QR Code no navegador
app.get("/qrcode", async (req, res) => {
  if (!lastQR) {
    return res.send("⏳ QR Code ainda não gerado. Aguarde alguns segundos e atualize a página.");
  }
  const qrImg = await qrcode.toDataURL(lastQR);
  res.send(`<h2>Escaneie o QR Code com o número OFICIAL: +55 77 98855-6030</h2><img src="${qrImg}" />`);
});

// 🟡 Rota de status
app.get("/", (req, res) => res.send("🤖 Bot WhatsApp rodando ✅"));

// 🟢 Inicializa servidor HTTP
app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`);
  startBot();
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    printQRInTerminal: true
  })
    browser: ["Ubuntu", "Chrome", "22.04.4"], // Identificação do cliente
  });

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      // gera QR Code em URL para navegador
      const qrDataUrl = await QRCode.toDataURL(qr)
      console.log('⚡ QR Code gerado! Acesse /qrcode para escanear')
      sock.qrDataUrl = qrDataUrl // guarda para servir na rota
      lastQR = qr;
      console.log("📱 QR Code gerado! Acesse /qrcode para escanear.");
    }

    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!')
      enviarMensagemAutomatica(sock)
    } else if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
    if (connection === "open") {
      console.log("✅ Conectado ao WhatsApp com sucesso!");
      enviarMensagensAutomaticas();
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log('⚠ Conexão caiu. Tentando reconectar...')
        startBot()
        console.log("⚠️ Conexão caiu. Tentando reconectar...");
        startBot();
      } else {
        console.log('❌ Desconectado. Faça login novamente.')
        console.log("❌ Sessão expirada. Será necessário escanear o QR novamente.");
      }
    }
  })
  });
}

// função para enviar mensagem automática
function enviarMensagemAutomatica(sock) {
  if (!sock || !sock.authState) return console.log('Socket não está pronto')
// 📨 Envia mensagens automáticas para uma lista de destinatários
async function enviarMensagensAutomaticas() {
  // ✅ Lista de destinatários no formato correto
  const destinatarios = [
    "5577981434412@s.whatsapp.net", // Exemplo: seu número pessoal
    "5577981145420@s.whatsapp.net"  // Outro exemplo
  ];

  const numero = '5577988556030@s.whatsapp.net' // número desejado
  const mensagem = 'Olá 👋 Esta é uma mensagem automática!'
  const mensagem = "👋 Esta é uma mensagem automática enviada pelo BOT oficial +55 77 98855-6030 ✅";

  sock.sendMessage(numero, { text: mensagem })
    .then(() => console.log('✅ Mensagem enviada com sucesso!'))
    .catch(err => console.error('❌ Erro ao enviar mensagem:', err))
}

// rota principal para testar
app.get('/', (req, res) => {
  res.send('Bot WhatsApp rodando ✅')
})

// rota para QR Code
app.get('/qrcode', (req, res) => {
  if (sock?.qrDataUrl) {
    res.send(`<img src="${sock.qrDataUrl}" />`)
  } else {
    res.send('QR Code ainda não gerado. Atualize em alguns segundos.')
  for (const numero of destinatarios) {
    try {
      await sock.sendMessage(numero, { text: mensagem });
      console.log(`📤 Mensagem enviada com sucesso para ${numero}`);
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${numero}:`, err);
    }
  }
})

// inicializa servidor e bot
app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`)
  startBot()
})
}
