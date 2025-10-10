import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, jidNormalizedUser } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json()); // Para ler JSON do POST

let sock;
let lastQR = null;
let botJid = null;

const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER);

// ─── Rota status ───────────────────────
app.get("/", (req, res) => {
  res.send(`🤖 Bot rodando - Número conectado: ${botJid || 'Aguardando conexão'}`);
});

// ─── Rota QR Code ─────────────────────
app.get("/qrcode", async (req, res) => {
  if (!lastQR) return res.send("⏳ QR Code ainda não gerado");
  const qrImg = await qrcode.toDataURL(lastQR);
  res.send(`<h2>Escaneie o QR Code</h2><img src="${qrImg}" />`);
});

// ─── Rota para enviar mensagem ─────────
app.post("/send-message", async (req, res) => {
  const { numero, mensagem } = req.body;
  console.log("🔹 Requisição recebida:", { numero, mensagem });

  if (!numero || !mensagem) return res.status(400).json({ error: "Número e mensagem obrigatórios" });
  if (!sock || !botJid) return res.status(503).json({ error: "Bot ainda não conectado" });

  try {
    const jid = `${numero.replace(/\D/g,'')}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: mensagem });
    console.log(`📤 Mensagem enviada para ${jid}: "${mensagem}"`);
    return res.json({ success: true, numero: jid, mensagem });
  } catch(err) {
    console.error("❌ Erro ao enviar mensagem:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Inicializa servidor HTTP ─────────
app.listen(PORT, () => {
  console.log(`🌐 Servidor ativo na porta ${PORT}`);
  startBot();
});

// ─── Inicializa Bot WhatsApp ──────────
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "22.04.4"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect, isNewLogin } = update;

    if (qr) {
      lastQR = qr;
      console.log("📱 QR Code gerado, acesse /qrcode");
    }

    if (connection === "open") {
      botJid = jidNormalizedUser(sock.user.id);
      console.log(`✅ Bot conectado: ${botJid}`);
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== 401) {
        console.log("⚠️ Conexão caiu. Reconectando...");
        startBot();
      } else {
        console.log("❌ Sessão expirada. Re-scan necessário.");
      }
    }
  });
}
