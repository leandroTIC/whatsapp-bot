import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

// Número oficial do bot
const NUMERO_OFICIAL = "5577988556030";

// Lista de destinatários (adicione mais se quiser)
const DESTINATARIOS = [
  "5577981434412", // Exemplo: destinatário 1
  "5577981145420"  // Exemplo: destinatário 2
];

let sock;
let lastQR = null;

/**
 * Gera e exibe o QR Code no navegador
 */
app.get("/qrcode", async (req, res) => {
  if (!lastQR) return res.send("⏳ QR Code ainda não gerado. Aguarde alguns segundos.");
  const qrImg = await qrcode.toDataURL(lastQR);
  res.send(`
    <h2>📱 Escaneie o QR Code com o WhatsApp do número oficial</h2>
    <img src="${qrImg}" />
    <p>Após escanear, mantenha o WhatsApp conectado neste número.</p>
  `);
});

/**
 * Rota de teste do bot
 */
app.get("/", (req, res) => {
  res.send("🤖 Bot WhatsApp rodando no Render ✅");
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ativo na porta ${PORT}`);
  startBot();
});

/**
 * Inicializa o bot WhatsApp
 */
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    version
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      lastQR = qr;
      console.log("✅ QR Code gerado! Acesse /qrcode para escanear.");
    }

    if (connection === "open") {
      console.log("✅ Conectado com sucesso ao WhatsApp!");
      enviarMensagensAutomaticas();
    } else if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠ Conexão caiu. Reconectando...", shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });
}

/**
 * Envia mensagens para todos os destinatários da lista
 */
async function enviarMensagensAutomaticas() {
  const mensagem = "👋 Olá! Esta é uma mensagem automática enviada pelo bot.";

  for (const numero of DESTINATARIOS) {
    const jid = `${numero}@s.whatsapp.net`;

    try {
      await sock.sendMessage(jid, { text: mensagem });
      console.log(`✅ Mensagem enviada com sucesso para ${numero}`);
    } catch (erro) {
      console.error(`❌ Erro ao enviar mensagem para ${numero}:`, erro);
    }
  }
}
