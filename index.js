import makeWASocket, { useSingleFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import express from 'express';
import fs from 'fs';

// Pasta para salvar sessão
const SESSION_FILE = './session.json';

// Cria pasta se não existir
if (!fs.existsSync('./auth_info')) fs.mkdirSync('./auth_info');

// Configura autenticação
const { state, saveState } = useSingleFileAuthState(SESSION_FILE);

// Cria store em memória
const store = {};

const startSock = () => {
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        browser: ['Bot', 'Chrome', '1.0.0']
    });

    // Atualiza sessão ao mudar
    sock.ev.on('creds.update', saveState);

    // Exibe QR Code em /qrcode
    const app = express();
    app.get('/qrcode', async (req, res) => {
        const qr = sock.ev.once('connection.update', async (update) => {
            if (update.qr) {
                const qrDataUrl = await QRCode.toDataURL(update.qr);
                res.send(`<img src="${qrDataUrl}"/>`);
            } else {
                res.send('QR Code não disponível no momento');
            }
        });
    });
    app.listen(3000, () => console.log('Acesse http://localhost:3000/qrcode para ver o QR Code'));

    // Reconexão automática
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('⚡ QR Code gerado! Escaneie com o WhatsApp');
        }
        if (connection === 'close') {
            const reason = (lastDisconnect.error as Boom)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log('❌ Conexão caiu. Tentando reconectar...');
                startSock();
            } else {
                console.log('❌ Conexão encerrada. Faça login novamente.');
            }
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    return sock;
};

startSock();
