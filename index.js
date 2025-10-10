import { default as makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import express from 'express';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Pasta de autenticação
const AUTH_DIR = './auth_info';

app.get('/qrcode', async (req, res) => {
    const qrImage = fs.existsSync(`${AUTH_DIR}/session.json`) ? null : 'QR ainda não gerado';
    res.send(qrImage);
});

async function startBot() {
    // Usando autenticação com múltiplos arquivos (novo método do Baileys)
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Pegar versão mais recente do WhatsApp Web
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true
    });

    // Salvar credenciais sempre que mudarem
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('⚡ QR Code gerado! Acesse /qrcode para escanear.');
            qrcode.toDataURL(qr).then(url => {
                fs.writeFileSync('./qrcode.html', `<img src="${url}">`);
            });
        }

        if (connection === 'close') {
            console.log('❌ Conexão caiu, tentando reconectar...', lastDisconnect?.error?.output?.statusCode);
            startBot(); // Reconnect
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', (m) => {
        console.log('Nova mensagem recebida: ', m);
    });
}

// Start
startBot();

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
