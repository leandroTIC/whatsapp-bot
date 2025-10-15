import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import express from 'express';

const PORT = 10000;
const AUTH_FOLDER = './auth';

// Cria pasta auth se não existir
if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER);
    console.log('📁 Pasta "auth" criada para armazenar credenciais.');
}

// Função principal do bot
function startBot() {
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: {
            creds: fs.existsSync(`${AUTH_FOLDER}/creds.json`)
                ? JSON.parse(fs.readFileSync(`${AUTH_FOLDER}/creds.json`))
                : undefined
        }
    });

    // Eventos de conexão
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Conexão perdida — tentando reconectar...', shouldReconnect ? '' : '(logout detectado)');
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    sock.ev.on('creds.update', (creds) => {
        fs.writeFileSync(`${AUTH_FOLDER}/creds.json`, JSON.stringify(creds, null, 2));
    });

    // Exemplo de envio de mensagem
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Mensagem recebida!' });
        }
    });
}

// Inicia bot
startBot();

// Servidor web simples
const app = express();
app.get('/', (req, res) => res.send('Bot WhatsApp rodando!'));
app.listen(PORT, () => console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`));
