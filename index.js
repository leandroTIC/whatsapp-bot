import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, proto } from '@whiskeysockets/baileys';
import fs from 'fs';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import express from 'express';

// Porta para servidor express (se quiser exibir QR Code via navegador)
const PORT = 3000;

// Pasta de autenticação
const AUTH_DIR = './auth_info';

// Cria a pasta se não existir
if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Estado de autenticação
const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

// Cria memória do bot
const store = makeInMemoryStore({ logger: P({ level: 'silent' }) });
store.readFromFile('./store.json');
setInterval(() => store.writeToFile('./store.json'), 10000);

// Função principal
async function startBot() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Usando Baileys v${version.join('.')}, Última versão? ${isLatest}`);

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        version
    });

    store.bind(sock.ev);

    // Evento QR Code
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = (lastDisconnect?.error)?.output?.statusCode;
            console.log('Conexão caiu, tentando reconectar...', reason);
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log('Desconectado permanentemente.');
            }
        }

        if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    // Salva credenciais automaticamente
    sock.ev.on('creds.update', saveCreds);

    // Exemplo de mensagem recebida
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!text) return;

        console.log('Mensagem recebida:', text);

        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' });
        }
    });
}

// Inicializa bot
startBot().catch(console.error);

// Servidor express para QR Code (opcional)
const app = express();
app.get('/qrcode', (req, res) => {
    res.send('<h2>Escaneie o QR Code no terminal!</h2>');
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
