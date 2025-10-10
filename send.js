// send.js
import express from "express";
import makeWASocket, { useMultiFileAuthState, jidNormalizedUser } from "@whiskeysockets/baileys";
import fs from "fs";

const app = express();
app.use(express.json()); // Para ler JSON do POST
const PORT = process.env.PORT || 10001; // Porta separada do index.js

// Pasta de autenticação (mesma do index.js)
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER);

let sock;
let botJid = null;

// Inicializa o bot WhatsApp
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    sock = makeWASocket({
        printQRInTerminal: true, // Mostra QR no terminal para debug
        auth: state,
        browser: ["Ubuntu", "Chrome", "22.04.4"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, isNewLogin } = update;

        console.log("🔄 update.connection:", connection);

        if (connection === "open") {
            botJid = jidNormalizedUser(sock.user.id);
            console.log(`✅ Bot conectado: ${botJid}`);
        } else if (connection === "close") {
            console.log("⚠️ Conexão caiu:", lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error);
            startBot(); // tenta reconectar
        }
    });
}

// Chama a inicialização do bot
startBot();

// Rota POST para enviar mensagem
app.post("/send-message", async (req, res) => {
    console.log("📥 Requisição recebida do PHP:", req.body); // <<< DEBUG

    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        console.log("⚠️ Dados inválidos:", req.body);
        return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
    }

    if (!sock || !botJid) {
        console.log("⚠️ Bot ainda não conectado");
        return res.status(503).json({ error: "Bot ainda não conectado" });
    }

    try {
        const jid = `${numero.replace(/\D/g, '')}@s.whatsapp.net`; // remove caracteres não numéricos
        console.log(`📤 Tentando enviar para: ${jid}, mensagem: "${mensagem}"`); // <<< DEBUG
        await sock.sendMessage(jid, { text: mensagem });
        console.log("✅ Mensagem enviada com sucesso!");
        return res.json({ success: true, numero: jid, mensagem });
    } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err); // <<< DEBUG completo
        return res.status(500).json({ error: err.message, stack: err.stack });
    }
});

app.listen(PORT, () => console.log(`🌐 API de envio rodando na porta ${PORT}`));
