import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import express from 'express';
import cron from 'node-cron';
import path from 'path';

const PORT = 10000;
const AUTH_FOLDER = './auth';
const ATLETAS_FILE = './atletas.json';

// Cria pasta auth se não existir
if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER);

// Carrega lista de atletas
const atletas = JSON.parse(fs.readFileSync(ATLETAS_FILE, 'utf-8'));

// Função principal do bot
function startBot() {
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: {
            creds: fs.existsSync(path.join(AUTH_FOLDER, 'creds.json'))
                ? JSON.parse(fs.readFileSync(path.join(AUTH_FOLDER, 'creds.json')))
                : undefined
        }
    });

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
        fs.writeFileSync(path.join(AUTH_FOLDER, 'creds.json'), JSON.stringify(creds, null, 2));
    });

    // Exemplo de envio de mensagens automáticas
    cron.schedule('0 9 * * *', async () => { // todos os dias às 09:00
        console.log('🚀 Enviando mensagens de mensalidade...');
        for (const atleta of atletas) {
            const numero = atleta.telefone + '@s.whatsapp.net';
            const mensagem = `Olá ${atleta.nome}, sua mensalidade foi paga com sucesso! ✅`;
            try {
                await sock.sendMessage(numero, { text: mensagem });
                console.log(`✅ Mensagem enviada para ${atleta.nome}`);
            } catch (err) {
                console.error(`❌ Erro ao enviar para ${atleta.nome}:`, err.message);
            }
        }
    }, { timezone: "America/Sao_Paulo" });

    // Responder mensagens recebidas
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message?.conversation) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Mensagem recebida!' });
        }
    });
}

// Inicia bot
startBot();

// Servidor web simples para Render
const app = express();
app.get('/', (req, res) => res.send('Bot WhatsApp rodando!'));
app.listen(PORT, () => console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`));
