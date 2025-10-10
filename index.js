import express from 'express';
import qrcode from 'qrcode';
import {
    makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useSingleFileAuthState
} from '@whiskeysockets/baileys';
import fs from 'fs';

const PORT = process.env.PORT || 10000;
const app = express();

// 📂 Caminho da sessão
const SESSION_FILE = './session.json';

// Variável global do socket
let sock;

// 🟢 Função principal
async function startWhatsApp() {
    // Carrega ou cria session.json
    const { state, saveState } = useSingleFileAuthState(SESSION_FILE);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false
    });

    // Salva credenciais automaticamente ao mudar
    sock.ev.on('creds.update', saveState);

    // Eventos de conexão
    sock.ev.on('connection.update', async (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            console.log('⚡ QR Code disponível! Acesse /qrcode para escanear.');
            app.get('/qrcode', async (req, res) => {
                const qrImage = await qrcode.toDataURL(qr);
                res.send(`<img src="${qrImage}" />`);
            });
        }

        if (connection === 'close') {
            const reason = (lastDisconnect?.error)?.output?.statusCode;
            console.log('❌ Conexão fechada. Tentando reconectar...', reason);
            setTimeout(startWhatsApp, 3000);
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp conectado com sucesso!');
            // Teste de envio automático
            setTimeout(async () => {
                await sendMessage('5577981434412', '🤖 Bot reconectado com session.json!');
            }, 2000);
        }
    });
}

// ✉️ Função genérica para envio de mensagem
async function sendMessage(number, message) {
    if (!sock || !sock.user) {
        console.log('⚠️ WhatsApp ainda não está conectado.');
        return;
    }

    const jid = number.includes('@s.whatsapp.net')
        ? number
        : `${number}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: message });
    console.log(`✅ Mensagem enviada para ${number}`);
}

// 🌐 Rotas HTTP
app.get('/', (req, res) => res.send('🤖 Bot WhatsApp com session.json rodando!'));
app.get('/send', async (req, res) => {
    const { number, msg } = req.query;
    if (!number || !msg) return res.send('Use /send?number=55NUMERO&msg=MENSAGEM');
    await sendMessage(number, msg);
    res.send(`Mensagem enviada para ${number}`);
});

// 🚀 Inicializa servidor + WhatsApp
app.listen(PORT, async () => {
    console.log(`Servidor HTTP ativo na porta ${PORT}`);
    await startWhatsApp();
});
