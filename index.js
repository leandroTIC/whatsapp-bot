import makeWASocket from '@whiskeysockets/baileys';
import express from 'express';
import fs from 'fs';
import path from 'path';

const PORT = 10000;
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER);

const app = express();

let sock;

function startBot() {
    sock = makeWASocket({
        auth: {
            creds: fs.existsSync(path.join(AUTH_FOLDER, 'creds.json'))
                ? JSON.parse(fs.readFileSync(path.join(AUTH_FOLDER, 'creds.json')))
                : undefined
        },
        printQRInTerminal: false // desabilitado
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('QR gerado, acessível em /qr');
            fs.writeFileSync(path.join(AUTH_FOLDER, 'qr.txt'), qr);
        }

        if (connection === 'close') {
            console.log('⚠️ Conexão perdida, tentando reconectar...');
            startBot();
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    sock.ev.on('creds.update', (creds) => {
        fs.writeFileSync(path.join(AUTH_FOLDER, 'creds.json'), JSON.stringify(creds, null, 2));
    });
}

startBot();

// Servidor web simples
app.get('/', (req, res) => res.send('Bot WhatsApp rodando!'));

// Endpoint para mostrar QR
app.get('/qr', (req, res) => {
    if (fs.existsSync(path.join(AUTH_FOLDER, 'qr.txt'))) {
        res.type('text/plain').send(fs.readFileSync(path.join(AUTH_FOLDER, 'qr.txt'), 'utf-8'));
    } else {
        res.send('QR code ainda não gerado, aguarde...');
    }
});

app.listen(PORT, () => console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`));
