const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const Message = require("./messages");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Servidor web para manter o bot vivo no Koyeb
app.get("/", (req, res) => {
    res.send("🤖 Bot WhatsApp está online no Koyeb!");
});
app.listen(PORT, () => console.log(`🌐 Servidor rodando na porta ${PORT}`));

// 🔹 Inicializa o cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/google-chrome', // Koyeb usa imagem com Chrome
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

client.on("qr", (qr) => {
    console.clear();
    console.log("📲 Escaneie este QR Code com o WhatsApp:");
    qrcode.generate(qr, { small: true });
});

client.once("ready", () => {
    console.log("✅ Bot conectado com sucesso!");
});

client.initialize();
