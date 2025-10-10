import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

let sock;       // Conexão com o WhatsApp
let lastQR = null; // Guarda o QR gerado para exibir no navegador
let botJid = null; // Armazena o JID (número) do bot após a conexão

// 🔸 Garante que a pasta de autenticação existe
const AUTH_FOLDER = './auth';
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER);
  console.log('📁 Pasta "auth" criada para armazenar credenciais.');
}

// 🟢 Rota para exibir o QR Code no navegador
app.get("/qrcode", async (req, res) => {
  if (!lastQR) {
    return res.send("⏳ **QR Code ainda não gerado.** Aguarde alguns segundos e atualize a página.");
  }
  const qrImg = await qrcode.toDataURL(lastQR);
  res.send(`<h2>Escaneie o QR Code com o número OFICIAL: +55 77 98855-6030</h2><img src="${qrImg}" />`);
});

// 🟡 Rota de status
app.get("/", (req, res) => res.send(`🤖 Bot WhatsApp rodando ✅ - Número conectado: ${botJid || 'Aguardando conexão'}`));

// 🟢 Inicializa servidor HTTP
app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`);
  startBot();
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "22.04.4"], // Identificação do cliente
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect, isNewLogin } = update;

    if (qr) {
      lastQR = qr;
      console.log("📱 QR Code gerado! Acesse /qrcode para escanear.");
    }

    if (connection === "open") {
      // Captura o JID (Remetente) do número que escaneou o QR Code
      botJid = sock.user.id; 
      console.log(`✅ Conectado ao WhatsApp com sucesso! REMETENTE: ${botJid}`);
      
      // Envia as mensagens automáticas na primeira conexão
      if (isNewLogin) {
        enviarMensagensAutomaticas();
      } else {
        console.log('Sessão restaurada. Não enviando mensagens automáticas novamente.');
      }

    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("⚠️ Conexão caiu. Tentando reconectar...");
        startBot();
      } else {
        console.log("❌ Sessão expirada. Será necessário escanear o QR novamente.");
      }
    }
  });
}

// 📨 Envia mensagens automáticas para uma lista de destinatários
async function enviarMensagensAutomaticas() {
  
  // 🔴 LISTA DE DESTINATÁRIOS
  // **MUITO IMPORTANTE:** Use números COMPLETAMENTE DIFERENTES do bot (+5577988556030).
  // Formato: DDI + DDD + Número + @s.whatsapp.net
  
  const destinatarios = [
    "5577981434412@s.whatsapp.net", // DESTINATÁRIO 1 (Troque por um número real que não seja o bot)
    "5577981145420@s.whatsapp.net"  // DESTINATÁRIO 2 (Troque por outro número real)
  ];

  const mensagem = "👋 Esta é uma mensagem automática enviada pelo BOT oficial +55 77 98855-6030 ✅";
  
  console.log(`\n--- INICIANDO ENVIO DE MENSAGENS (Remetente: ${botJid}) ---`);

  for (const numero of destinatarios) {
    // ✅ VERIFICAÇÃO DE SEGURANÇA: Garante que não envia para o próprio bot
    if (numero === botJid) {
      console.warn(`⚠️ Pulando envio. O próprio número do BOT (${numero}) está na lista de destinatários.`);
      continue; 
    }
    
    try {
      // O sock.sendMessage usa o 'botJid' (Remetente) para enviar para 'numero' (Destinatário)
      await sock.sendMessage(numero, { text: mensagem });
      console.log(`📤 Mensagem enviada com sucesso para o DESTINATÁRIO: ${numero}`);
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${numero}:`, err.message);
    }
  }
  
  console.log('--- ENVIO DE MENSAGENS CONCLUÍDO ---\n');
}
