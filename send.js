// send.js - Bot WhatsApp para envio via API (Render-ready)
import express from "express";
import makeWASocket, { useMultiFileAuthState, jidNormalizedUser } from "@whiskeysockets/baileys";
import fs from "fs";

const app = express();
app.use(express.json()); // Para ler JSON do POST

// Porta fornecida pelo Render
const PORT = process.env.PORT || 10001;

// Pasta de autenticação (mesma do index.js)
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER);

let sock;
let botJid = null;

// Inicializa o bot WhatsApp
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    sock = makeWASocket({
        printQRInTerminal: false,
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

// Rota POST para enviar mensagem
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

// Teste de rota GET simples
app.get("/", (req, res) => res.send(`🤖 Bot WhatsApp API rodando! Número conectado: ${botJid || 'Aguardando conexão'}`));

// Inicia o servidor HTTP
app.listen(PORT, () => console.log(`🌐 API de envio rodando na porta ${PORT}`));
