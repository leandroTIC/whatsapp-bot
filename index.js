import express from 'express';
import qrcode from 'qrcode';
import {
    makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState
} from '@whiskeysockets/baileys';

const PORT = process.env.PORT || 10000;
const app = express();

// Pasta onde fica a sessão autenticada
const authFolder = './auth_info_baileys';
let sock;

// 🧠 Função principal de inicialização
async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // Conexão com WhatsApp
    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;

        // 👉 Gera QR e disponibiliza na rota /qrcode
        if (qr) {
            console.log('⚡ QR Code gerado! Acesse /qrcode no navegador para escanear.');
            app.get('/qrcode', async (req, res) => {
                try {
                    const qrImage = await qrcode.toDataURL(qr);
                    res.send(`<img src="${qrImage}" />`);
                } catch (err) {
                    res.send('Erro ao gerar QR Code');
                }
            });
        }

        // 👉 Se cair, tenta reconectar
        if (connection === 'close') {
            const reason = (lastDisconnect?.error)?.output?.statusCode;
            console.log('❌ Conexão caiu, tentando reconectar...', reason);
            startWhatsApp();
        }

        // 👉 Conectou com sucesso
        if (connection === 'open') {
            console.log('✅ WhatsApp conectado com sucesso!');
            console.log('📲 Número conectado:', sock.user?.id || '(desconhecido)');

            // Envio de mensagem de teste após 3s
            setTimeout(async () => {
                try {
                    await sendMessage('5577981434412', 'Oi, tudo bem? Teste automático ✅');
                    console.log('📨 Mensagem de teste enviada para 5577981434412');
                } catch (err) {
                    console.error('❌ Erro ao enviar mensagem de teste:', err);
                }
            }, 3000);
        }
    });
}

// 📩 Função para enviar mensagem
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

// 🌐 Rotas HTTP básicas
app.get('/', (req, res) => res.send('🤖 Bot WhatsApp rodando!'));

app.get('/send', async (req, res) => {
    const { number, msg } = req.query;
    if (!number || !msg) return res.send('Use /send?number=55NUMERO&msg=MENSAGEM');

    await sendMessage(number, msg);
    res.send(`Mensagem enviada para ${number}`);
});

// 🚀 Inicia servidor + WhatsApp
app.listen(PORT, async () => {
    console.log(`🚀 Servidor HTTP ativo na porta ${PORT}`);
    await startWhatsApp();
});
