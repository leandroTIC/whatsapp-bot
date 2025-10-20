const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Message = require('./messages');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: process.env.SESSION_PATH || './session'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// QR Code no terminal
client.on('qr', (qr) => {
    console.clear();
    console.log('📲 Escaneie este QR Code com o WhatsApp do número desejado:');
    qrcode.generate(qr, { small: true });
});

// Bot pronto
client.once('ready', () => {
    console.log('✅ Bot conectado com sucesso!');
});

// Inicializa o bot
client.initialize();

// Gerenciamento simples de mensagens
const userState = {};

client.on('message', async (msg) => {
    const chatId = msg.from;
    const body = msg.body.trim().toLowerCase();

    if (body === 'menu' || !userState[chatId]) {
        userState[chatId] = 'menu';
        return client.sendMessage(chatId, Message.getMessage(10));
    }

    if (userState[chatId] === 'menu') {
        if (body === '2') {
            userState[chatId] = 'attendent';
        }
        return client.sendMessage(chatId, Message.getMessage(body));
    }
});

client.on('message_create', async (msg) => {
    const chatId = msg.to;
    const body = msg.body.trim().toLowerCase();

    if (msg.fromMe && body === 'encerrar atendimento') {
        userState[chatId] = 'menu';
        await client.sendMessage(chatId, Message.getMessage(7));
        await sleep(3000);
        return client.sendMessage(chatId, Message.getMessage(10));
    }
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
