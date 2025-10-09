import makeWASocket, { useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";

// Caminho do arquivo de sessão
const SESSION_FILE = path.resolve("./auth_state.json");
const { state, saveState } = useSingleFileAuthState(SESSION_FILE);

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    console.log(`Conectando com WhatsApp versão ${version.join(".")}`);

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true
    });

    // Salva a sessão automaticamente
    sock.ev.on("creds.update", saveState);

    // Atualizações de conexão
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log("Conexão fechada, statusCode:", statusCode);
            if (statusCode !== DisconnectReason.loggedOut) {
                startBot(); // reconectar automaticamente
            } else {
                console.log("Você foi desconectado, scan o QR novamente.");
            }
        } else if (connection === "open") {
            console.log("Bot conectado com sucesso!");
        }
    });

    // Receber mensagens
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message?.extendedTextMessage?.text;
        const from = msg.key.remoteJid;

        console.log(`Mensagem de ${from}: ${text}`);

        // Resposta simples
        if (text?.toLowerCase() === "ping") {
            await sock.sendMessage(from, { text: "pong" });
        }
    });
}

// Inicia o bot
startBot();
