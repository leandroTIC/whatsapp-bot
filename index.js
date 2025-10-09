import makeWASocket, { useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import fs from 'fs';
import path from 'path';

// Caminho do arquivo de sessão
const SESSION_FILE = path.resolve('./session.json');

// Cria ou carrega a sessão
const { state, saveState } = useSingleFileAuthState(SESSION_FILE);

// Função principal do bot
async function startBot() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Usando versão do WhatsApp: ${version.join('.')}, Última versão? ${isLatest}`);

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true, // QR no terminal, só na primeira vez
    });

    // Salva a sessão automaticamente
    sock.ev.on('creds.update', saveState);

    // Atualizações de conexão
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log('Conexão fechada, motivo:', reason);
            if (reason !== 401) startBot(); // reconecta se não for logout
        } else if (connection === 'open') {
            console.log('Bot conectado com sucesso!');
        }
    });

    // Recebe mensagens
    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const messages = messageUpdate.messages;
        if (!messages || messages.length === 0) return;

        const msg = messages[0];
        if (!msg.message) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        const from = msg.key.remoteJid;

        console.log(`Mensagem de ${from}: ${text}`);

        // Resposta simples de exemplo
        if (text?.toLowerCase() === 'ping') {
            await sock.sendMessage(from, { text: 'pong' });
        }
    });
}

// Inicia o bot
startBot();
