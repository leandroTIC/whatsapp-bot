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

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "22.04.4"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
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

// 🌐 Exibe o QR Code
app.get("/qrcode", async (req, res) => {
  if (!lastQR) {
    return res.send("⏳ QR Code ainda não gerado. Aguarde alguns segundos...");
  }

  try {
    const qrImage = await qrcode.toDataURL(lastQR);
    res.send(`
      <h1>📱 Escaneie o QR Code abaixo com o WhatsApp</h1>
      <img src="${qrImage}" />
    `);
  } catch (err) {
    res.status(500).send("❌ Erro ao gerar QR Code.");
  }
});

// 📨 Rota para enviar mensagens: /send?to=5598999999999&msg=Olá
app.get("/send", async (req, res) => {
  const { to, msg } = req.query;

  if (!sock) {
    return res.status(500).send("❌ Bot ainda não está conectado ao WhatsApp.");
  }
  if (!to || !msg) {
    return res.status(400).send("⚠️ Parâmetros 'to' e 'msg' são obrigatórios.");
  }

  try {
    const jid = `${to}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: msg });
    console.log(`📤 Mensagem enviada para ${to}: ${msg}`);
    res.send(`✅ Mensagem enviada com sucesso para ${to}`);
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem:", err);
    res.status(500).send("❌ Erro ao enviar mensagem.");
  }
});

// 🚀 Inicializa servidor + bot
app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`);
  startBot();
});
