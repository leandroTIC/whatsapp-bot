import makeWASocket, { useSingleFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import fs from 'fs';

// Pasta para armazenar sessão
const SESSION_FILE = './session.json';

// Cria a pasta se não existir
if (!fs.existsSync('./')) fs.mkdirSync('./');

// Usa autenticação em arquivo único
const { state, saveState } = useSingleFileAuthState(SESSION_FILE);

// Cria a conexão
const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state
});

// Salva alterações de sessão
sock.ev.on('creds.update', saveState);

// Eventos de conexão
sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
        qrcode.generate(qr, { small: true });
        console.log('⚡ QR Code gerado! Escaneie com o WhatsApp.');
    }

    if (connection === 'close') {
        const reason = (lastDisconnect.error as Boom)?.output?.statusCode;
        console.log('❌ Conexão fechada', reason);
        if (reason !== DisconnectReason.loggedOut) {
            console.log('🔄 Tentando reconectar...');
            startSock();
        } else {
            console.log('⚠️ Sessão desconectada, delete session.json e tente novamente.');
        }
    } else if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
    }
});

// Função para reconectar
function startSock() {
    sock.ws.close();
}
