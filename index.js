import express from 'express';
import qrcode from 'qrcode';
import { makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 10000;
const app = express();

// Caminho para armazenar o login do WhatsApp
const authFile = './auth_info.json';
const { state, saveState } = useSingleFileAuthState(authFile);

let sock;

// Função para iniciar conexão com WhatsApp
async function startWhatsApp() {
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            console.log('QR Code gerado! Acesse /qrcode no navegador para escanear.');
            app.get('/qrcode', async (req, res) => {
                try {
                    const qrImage = await qrcode.toDataURL(qr);
                    res.send(`<img src="${qrImage}" />`);
                } catch (err) {
                    res.send('Erro ao gerar QR Code');
                }
            });
        }

        if (connection === 'close') {
            const reason = (lastDisconnect.error)?.output?.statusCode;
            console.log('Conexão caiu, tentando reconectar...', reason);
            startWhatsApp();
        }

        if (connection === 'open') {
            console.log('WhatsApp conectado!');
        }
    });
}

// Função para enviar mensagem
async function sendMessage(number, message) {
    if (!sock || !sock.user) {
        console.log('WhatsApp não conectado ainda.');
        return;
    }

    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    console.log(`Mensagem enviada para ${number}`);
}

// Rotas simples
app.get('/', (req, res) => res.send('Bot WhatsApp rodando!'));
app.get('/send', async (req, res) => {
    const { number, msg } = req.query;
    if (!number || !msg) return res.send('Use /send?number=55NUMERO&msg=MENSAGEM');
    await sendMessage(number, msg);
    res.send(`Mensagem enviada para ${number}`);
});

// Inicia servidor e WhatsApp
app.listen(PORT, async () => {
    console.log(`Servidor HTTP ativo na porta ${PORT}`);
    await startWhatsApp();
});
