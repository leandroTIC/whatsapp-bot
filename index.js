// index.js
import makeWASocket, { 
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    makeInMemoryStore
} from '@whiskeysockets/baileys';
import P from 'pino';

// Cria pasta auth_info_baileys para salvar credenciais
const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

// Cria store em memória (opcional, mas útil para eventos e histórico)
const store = makeInMemoryStore({ logger: P({ level: 'silent' }) });

// Função principal do bot
async function startBot() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Baileys version: ${version}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,  // mostra QR se necessário
        auth: state
    });

    // Vincula store aos eventos do socket
    store.bind(sock.ev);

    // Salva credenciais quando necessário
    sock.ev.on('creds.update', saveCreds);

    // Log de conexões
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('Conexão caiu, tentando reconectar...', reason);
            startBot(); // reconecta automaticamente
        } else if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp!');
        }
    });

    // Exemplo de mensagem recebida
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;
        const sender = msg.key.remoteJid;
        console.log(`Mensagem recebida de ${sender}:`, msg.message.conversation);
    });
}

// Inicia o bot
startBot();
