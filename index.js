import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
// O Render usa a porta dinâmica, o process.env.PORT é essencial.
const PORT = process.env.PORT || 10000;

let sock;       // Conexão com o WhatsApp
let lastQR = null; // Guarda o QR gerado para exibir no navegador
let botJid = null; // Armazena o JID (número) do bot após a conexão

// 🔸 Garante que a pasta de autenticação existe (para o Baileys)
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
      // Armazena o número do bot. Ex: 5577988556030@s.whatsapp.net
      botJid = sock.user.id;
      console.log(`✅ Conectado ao WhatsApp com sucesso! JID: ${botJid}`);
      
      // A função de envio deve ser chamada uma única vez após a conexão,
      // ou baseada em algum gatilho (timer, API, etc.).
      // Se você quer que envie *apenas* na primeira conexão/login, use `isNewLogin`.
      // Se você quer que envie em toda reconexão (o que não é ideal para informativos), mantenha a chamada direta.
      
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
  
  // 🔴 ATENÇÃO: VERIFIQUE ESTA LISTA!
  // O número do BOT (+5577988556030) NÃO PODE ESTAR AQUI.
  const destinatarios = [
    "5577981434412@s.whatsapp.net", // Seu número de teste (NÃO o 6030)
    "5577981145420@s.whatsapp.net"  // Outro destinatário
  ];

  const mensagem = "👋 Esta é uma mensagem automática enviada pelo BOT oficial +55 77 98855-6030 ✅";
  
  console.log(`\n--- INICIANDO ENVIO DE MENSAGENS DO BOT ${botJid} ---`);

  for (const numero of destinatarios) {
    if (numero === botJid) {
      console.warn(`⚠️ Pulando envio para o próprio número do BOT: ${numero}`);
      continue; // Pula o próprio número, se estiver na lista
    }
    
    try {
      await sock.sendMessage(numero, { text: mensagem });
      console.log(`📤 Mensagem enviada com sucesso para ${numero}`);
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${numero}:`, err.message);
    }
  }
  
  console.log('--- ENVIO DE MENSAGENS CONCLUÍDO ---\n');
}
