import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, DisconnectReason, jidNormalizedUser } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json()); // Para receber JSON no POST

let sock;
let lastQR = null;
let botJid = null;

// 🔸 Garante que a pasta de autenticação existe
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER);
    console.log('📁 Pasta "auth" criada para armazenar credenciais.');
}

// 🟢 Rota para exibir o QR Code no navegador
app.get("/qrcode", async (req, res) => {
    if (!lastQR) {
        return res.send("⏳ **QR Code ainda não gerado.** Aguarde alguns segundos e atualize a página.");
    }
    const qrImg = await qrcode.toDataURL(lastQR);
    res.send(`<h2>Escaneie o QR Code com o número OFICIAL: +55 77 98855-6030</h2><img src="${qrImg}" />`);
});

// 🟡 Rota de status
app.get("/", (req, res) => res.send(`🤖 Bot WhatsApp rodando ✅ - Número conectado (Normalizado): ${botJid || 'Aguardando conexão'}`));

// 📨 Rota para envio de mensagens via POST
app.post("/send-message", async (req, res) => {
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
    }

    if (!sock || !botJid) {
        return res.status(503).json({ error: "Bot ainda não conectado. Tente novamente em alguns segundos." });
    }

    try {
        const jid = `${numero.replace(/\D/g, '')}@s.whatsapp.net`; // Remove caracteres não numéricos
        await sock.sendMessage(jid, { text: mensagem });
        console.log(`📤 Mensagem enviada para ${jid}: "${mensagem}"`);
        return res.json({ success: true, numero: jid, mensagem });
    } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

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
            console.log(`✅ Conectado ao WhatsApp com sucesso! REMETENTE NORMALIZADO: ${botJid}`);
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
