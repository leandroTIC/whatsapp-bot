const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Message = require('./messages');

const client = new Client({
    authStrategy: new LocalAuth({
        // se estiver usando disco persistente (Railway, plano pago do Render)
        dataPath: './session'
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

// 🔸 Este evento mostra o QR Code no terminal do Render/Railway
client.on('qr', (qr) => {
    console.clear();
    console.log('📲 Escaneie este QR Code com o WhatsApp do número desejado:');
    qrcode.generate(qr, { small: true });  // <- Mostra no terminal
});

// Quando a conexão for bem-sucedida
client.once('ready', () => {
    console.log('✅ Bot conectado com sucesso!');
});

client.initialize();
