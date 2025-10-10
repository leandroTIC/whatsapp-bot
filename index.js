import express from 'express';
import qrcode from 'qrcode';
import {
    makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState
} from '@whiskeysockets/baileys';
import fs from 'fs';

const PORT = process.env.PORT || 10000;
const app = express();

const AUTH_FOLDER = './auth_info_baileys';
let sock;

// 🟢 Iniciar WhatsApp
async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            console.log('⚡ QR Code gerado! Acesse /qrcode para escanear.');
            app.get('/qrcode', async (req, res) => {
                const qrImage = await qrcode.toDataURL(qr);
                res.send(`<img src="${qrImage}" />`);
            });
        }

        if (connection === 'close') {
            const reason = (lastDisconnect?.error)?.output?.statusCode;
            console.log('❌ Conexão caiu. Tentando reconectar...', reason);
            setTimeout(startWhatsApp, 2000);
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp conectado com sucesso!');
            setTimeout(async () => {
                await sendMessage('5577981434412', '🚀 Teste automático após conexão com MultiFileAuth!');
            }, 2000);
        }
    });
}

// ✉️ Função genérica para enviar mensagem
async function sendMessage(number, message) {
    if (!sock || !sock.user) {
        console.log('⚠️ WhatsApp ainda não está conectado.');
        return;
    }

    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    console.log(`✅ Mensagem enviada para ${number}`);
}

// 🌐 Rotas
app.get('/', (req, res) => res.send('🤖 Bot WhatsApp rodando com MultiFileAuth!'));
app.get('/send', async (req, res) => {
    const { number, msg } = req.query;
    if (!number || !msg) return res.send('Use /send?number=55NUMERO&msg=MENSAGEM');
    await sendMessage(number, msg);
    res.send(`Mensagem enviada para ${number}`);
});

// 🚀 Inicialização
app.listen(PORT, async () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    await startWhatsApp();
});
