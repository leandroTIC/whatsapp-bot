import express from "express";
import makeWASocket, { useMultiFileAuthState, jidNormalizedUser } from "@whiskeysockets/baileys";
import fs from "fs";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 10001;

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
        const { connection } = update;

        if (connection === "open") {
            botJid = jidNormalizedUser(sock.user.id);
            console.log(`✅ Bot conectado: ${botJid}`);
        } else if (connection === "close") {
            console.log("⚠️ Conexão caiu, tentando reconectar...");
            startBot();
        }
    });
}

startBot();

// Rota POST para enviar mensagem
app.post("/send-message", async (req, res) => {
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        return res.status(400).json({ success: false, error: "Número e mensagem são obrigatórios" });
    }

    if (!sock || !botJid) {
        return res.status(503).json({ success: false, error: "Bot ainda não conectado. Tente novamente em alguns segundos." });
    }

    try {
        const jid = `${numero.replace(/\D/g, '')}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: mensagem });
        console.log(`📤 Mensagem enviada para ${jid}: "${mensagem}"`);

        // 🔹 Retorno sempre em JSON
        return res.json({ success: true, numero: jid, mensagem });
    } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err);
        return res.status(500).json({ success: false, error: err.message || "Erro desconhecido" });
    }
});

app.listen(PORT, () => console.log(`🌐 API de envio rodando na porta ${PORT}`));
