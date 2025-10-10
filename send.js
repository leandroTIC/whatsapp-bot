// send.js - Bot WhatsApp para Render
import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, jidNormalizedUser } from "@whiskeysockets/baileys";

const app = express();
app.use(express.json()); // Para ler JSON do POST

const PORT = process.env.PORT || 10001; // Porta do Render

// 🔸 Garante que a pasta de autenticação existe
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER);

let sock;
let botJid = null;

// 🔹 Inicializa o bot WhatsApp
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    sock = makeWASocket({
        printQRInTerminal: true, // Para debug no terminal
        auth: state,
        browser: ["Ubuntu", "Chrome", "22.04.4"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            botJid = jidNormalizedUser(sock.user.id);
            console.log(`✅ Bot conectado: ${botJid}`);
        } else if (connection === "close") {
            console.log("⚠️ Conexão caiu, tentando reconectar...");
            startBot();
        }
    });
}

// Chama a inicialização do bot
startBot();

// 🔹 Rota POST /send-message
app.post("/send-message", async (req, res) => {
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
    }

    if (!sock || !botJid) {
        return res.status(503).json({ error: "Bot ainda não conectado. Tente novamente em alguns segundos." });
    }

    try {
        const jid = `${numero.replace(/\D/g, '')}@s.whatsapp.net`; // Remove qualquer caractere que não seja número
        await sock.sendMessage(jid, { text: mensagem });
        console.log(`📤 Mensagem enviada para ${jid}: "${mensagem}"`);
        return res.json({ success: true, to: jid, message: mensagem });
    } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// 🔹 Inicia o servidor HTTP
app.listen(PORT, () => {
    console.log(`🌐 API de envio rodando na porta ${PORT}`);
});
