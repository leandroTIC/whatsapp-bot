import makeWASocket, { useSingleFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';

const PORT = process.env.PORT || 10000;

// Cria pasta auth se não existir
if (!fs.existsSync('./auth')) fs.mkdirSync('./auth');

// Usa arquivo único para sessão
const { state, saveState } = useSingleFileAuthState('./auth/session.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['RenderBot', 'Chrome', '22.04.4']
    });

    sock.ev.on('creds.update', saveState);

    // Log de conexão
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Conexão perdida — tentando reconectar...', shouldReconnect ? '' : '(logout detectado)');
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    // Evento de mensagens recebidas
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation) {
            console.log(`📩 Mensagem recebida de ${msg.key.remoteJid}: ${msg.message.conversation}`);
            // Resposta automática de teste
            await sock.sendMessage(msg.key.remoteJid, { text: 'Mensagem recebida!' });
        }
    });
}

startBot().catch(err => console.log(err));
