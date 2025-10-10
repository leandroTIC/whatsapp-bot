import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

let sock;       // conexão com o WhatsApp
let lastQR = null; // guarda o QR gerado para exibir no navegador

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
    browser: ["Ubuntu", "Chrome", "22.04.4"], // Identificação do cliente
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      lastQR = qr;
      console.log("📱 QR Code gerado! Acesse /qrcode para escanear.");
    }

    if (connection === "open") {
      console.log("✅ Conectado ao WhatsApp com sucesso!");
      enviarMensagensAutomaticas();
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("⚠️ Conexão caiu. Tentando reconectar...");
        startBot();
      } else {
        console.log("❌ Sessão expirada. Será necessário escanear o QR novamente.");
      }
    }
  });
}

// 📨 Envia mensagens automáticas para uma lista de destinatários
async function enviarMensagensAutomaticas() {
  // ✅ Lista de destinatários no formato correto
  const destinatarios = [
    "5577981434412@s.whatsapp.net", // Exemplo: seu número pessoal
    "5577981145420@s.whatsapp.net"  // Outro exemplo
  ];

  const mensagem = "👋 Esta é uma mensagem automática enviada pelo BOT oficial +55 77 98855-6030 ✅";

  for (const numero of destinatarios) {
    try {
      await sock.sendMessage(numero, { text: mensagem });
      console.log(`📤 Mensagem enviada com sucesso para ${numero}`);
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${numero}:`, err);
    }
  }
}
