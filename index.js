import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, jidNormalizedUser, DisconnectReason } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json()); // Para aceitar JSON no POST

// -------------------
// Variáveis globais
// -------------------
let sock;
let lastQR = null;
let botJid = null;

// -------------------
// Pasta de autenticação
// -------------------
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER);
    console.log('📁 Pasta "auth" criada para armazenar credenciais.');
}

// -------------------
// Rota QR Code
// -------------------
app.get("/qrcode", async (req, res) => {
    if (!lastQR) return res.send("⏳ QR Code ainda não gerado. Aguarde alguns segundos...");
    const qrImg = await qrcode.toDataURL(lastQR);
    res.send(`<h2>Escaneie o QR Code com o número oficial</h2><img src="${qrImg}" />`);
});

// -------------------
// Status do bot
// -------------------
app.get("/", (req, res) => res.send(`🤖 Bot rodando ✅ - Número conectado: ${botJid || 'Aguardando conexão'}`));

// -------------------
// Rota POST /send-message
// -------------------
app.post("/send-message", async (req, res) => {
    console.log("🔹 Requisição recebida em /send-message:", req.body);

    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
    }

    if (!sock || !botJid) {
        return res.status(503).json({ error: "Bot ainda não conectado. Tente novamente em alguns segundos." });
    }

    try {
        const jid = `${numero.replace(/\D/g, '')}@s.whatsapp.net`;
        console.log(`📤 Enviando mensagem para ${jid}...`);

        await sock.sendMessage(jid, { text: mensagem });

        console.log(`✅ Mensagem enviada com sucesso para ${jid}: "${mensagem}"`);
        return res.json({ success: true, numero: jid, mensagem });
    } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err);
        return res.status(500).json({ error: err.message });
    }
});

// -------------------
// Inicializa o bot WhatsApp
// -------------------
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
            console.log("📱 QR Code gerado! Acesse /qrcode para escanear.");
        }

        if (connection === "open") {
            botJid = jidNormalizedUser(sock.user.id);
            console.log(`✅ Bot conectado: ${botJid}`);
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

// -------------------
// Inicializa servidor
// -------------------
app.listen(PORT, () => {
    console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
    startBot();
});
