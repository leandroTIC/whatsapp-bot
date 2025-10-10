import express from 'express';
import qrcode from 'qrcode';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';

const PORT = process.env.PORT || 10000;
const app = express();

let sock;
let qrCodeAtual = null;

// Função para iniciar conexão com WhatsApp
async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      qrCodeAtual = qr;
      console.log('✅ QR Code gerado! Acesse /qrcode no navegador para escanear.');
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error)?.output?.statusCode;
      console.log('⚠ Conexão caiu, tentando reconectar...', reason);
      startWhatsApp();
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp conectado com sucesso!');
    }
  });
}

// Função para enviar mensagem
async function sendMessage(number, message) {
  if (!sock || !sock.user) {
    console.log('❌ WhatsApp não conectado ainda.');
    return;
  }

  const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: message });
  console.log(`📩 Mensagem enviada para ${number}`);
}

// Rota para exibir o QR Code no navegador
app.get('/qrcode', async (req, res) => {
  if (!qrCodeAtual) return res.send('QR Code ainda não foi gerado. Aguarde...');
  const qrImage = await qrcode.toDataURL(qrCodeAtual);
  res.send(`<h2>Escaneie com o WhatsApp</h2><img src="${qrImage}" />`);
});

// Rota simples de status
app.get('/', (req, res) => res.send('🤖 Bot WhatsApp rodando no Render!'));

// Rota para enviar mensagem manualmente
app.get('/send', async (req, res) => {
  const { number, msg } = req.query;
  if (!number || !msg) return res.send('Use /send?number=55NUMERO&msg=MENSAGEM');
  await sendMessage(number, msg);
  res.send(`Mensagem enviada para ${number}`);
});

// Inicia servidor e WhatsApp
app.listen(PORT, async () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`);
  await startWhatsApp();
});
