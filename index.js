import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, jidNormalizedUser } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json()); // necessário para receber JSON do POST

let sock;
let lastQR = null;
let botJid = null;

// Lista para debug (armazenar todas as mensagens recebidas)
let debugMensagens = [];

// 🔸 Pasta auth
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER);

// 🟢 Rota para exibir QR code
app.get("/qrcode", async (req, res) => {
  if (!lastQR) return res.send("⏳ QR Code ainda não gerado.");
  const qrImg = await qrcode.toDataURL(lastQR);
  res.send(`<h2>Escaneie o QR do número oficial</h2><img src="${qrImg}" />`);
});

// 🟡 Rota de status do bot
app.get("/", (req, res) => res.send(`🤖 Bot rodando - Número: ${botJid || 'Aguardando conexão'}`));

// 🟢 Rota de debug para ver todas as mensagens recebidas do PHP
app.get("/debug", (req, res) => {
  let html = `<h2>Mensagens recebidas via index.php</h2>`;
  html += `<ul>`;
  debugMensagens.forEach((m, i) => {
    html += `<li><strong>${i+1}</strong> - Número: ${m.numero}, Mensagem: ${m.mensagem}</li>`;
  });
  html += `</ul>`;
  res.send(html);
});

// 🟢 Rota POST para receber mensagem do PHP
app.post("/send-message", async (req, res) => {
  const { numero, mensagem } = req.body;

  if (!numero || !mensagem) {
    return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
  }

  // Armazena para debug
  debugMensagens.push({ numero, mensagem });

  if (!sock || !botJid) {
    return res.status(503).json({ error: "Bot ainda não conectado" });
  }

  try {
    const jid = `${numero.replace(/\D/g,'')}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: mensagem });
    console.log(`📤 Mensagem enviada para ${jid}: "${mensagem}"`);
    return res.json({ success: true, numero: jid, mensagem });
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 🟢 Inicializa o bot
app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`);
  startBot();
});

// 🟢 Função principal do bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "22.04.4"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, isNewLogin } = update;
    if (qr) lastQR = qr;

    if (connection === "open") {
      botJid = jidNormalizedUser(sock.user.id);
      console.log(`✅ Bot conectado: ${botJid}`);
    } else if (connection === "close") {
      console.log("⚠️ Conexão caiu, tentando reconectar...");
      startBot();
    }
  });
}
