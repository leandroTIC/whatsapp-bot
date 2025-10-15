import express from "express";
import fs from "fs";
import qrcode from "qrcode";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";

const app = express();
const PORT = process.env.PORT || 3000;

let sock;
let lastQR;

// 📁 Garante que a pasta de autenticação exista
const AUTH_FOLDER = "./auth";
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER);
  console.log("📁 Pasta 'auth' criada para armazenar credenciais.");
}

// 🔄 Função principal do bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  sock = makeWASocket({
    printQRInTerminal: false, // Não mostra no terminal (Render não exibe)
    auth: state,
    browser: ["Ubuntu", "Chrome", "22.04.4"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      lastQR = qr;
      console.log("📲 QR Code gerado — acesse /qrcode para escanear.");
    }

    if (connection === "open") {
      console.log("✅ Conectado ao WhatsApp!");
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("⚠️ Conexão perdida — tentando reconectar...");
        startBot();
      } else {
        console.log("❌ Sessão expirada. Será necessário escanear novamente.");
      }
    }
  });
}

// 🌐 Rota principal
app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 Bot WhatsApp rodando!</h1>
    <p>Acesse <a href="/qrcode">/qrcode</a> para escanear o QR Code.</p>
  `);
});

// 🌐 Rota para exibir o QR Code em imagem
app.get("/qrcode", async (req, res) => {
  if (!lastQR) {
    return res.send("⏳ QR Code ainda não gerado. Aguarde alguns segundos...");
  }

  try {
    const qrImage = await qrcode.toDataURL(lastQR);
    const html = `
      <h1>📱 Escaneie o QR Code abaixo com o WhatsApp</h1>
      <img src="${qrImage}" />
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("❌ Erro ao gerar QR Code.");
  }
});

// 🚀 Inicializa o servidor + bot
app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`);
  startBot();
});
