import express from "express";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, DisconnectReason, jidNormalizedUser } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

let sock;       
let lastQR = null; 
let botJid = null; 

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
app.get("/", (req, res) => res.send(`🤖 Bot WhatsApp rodando ✅ - Número conectado (Normalizado): ${botJid || 'Aguardando conexão'}`));

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
    browser: ["Ubuntu", "Chrome", "22.04.4"], 
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect, isNewLogin } = update;

    if (qr) {
      lastQR = qr;
      console.log("📱 QR Code gerado! Acesse /qrcode para escanear.");
    }

    if (connection === "open") {
      // Normaliza o JID (Remetente)
      botJid = jidNormalizedUser(sock.user.id); 
      console.log(`✅ Conectado ao WhatsApp com sucesso! REMETENTE NORMALIZADO: ${botJid}`);
      
      if (isNewLogin) {
        // Chama a função para enviar a mensagem após a conexão
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
  
  // 🔴 DEFINIÇÃO DO DESTINATÁRIO ÚNICO
  // Número: +5577981434412 no formato JID
  const destinatarios = [
    "5577981434412@s.whatsapp.net"
  ];

  // 🎁 MENSAGEM PERSONALIZADA
  const mensagem = "Bom dia meu amor ❤️";
  
  console.log(`\n--- INICIANDO ENVIO DE MENSAGENS (Remetente Normalizado: ${botJid}) ---`);

  for (const numero of destinatarios) {
    // Verificação de segurança (caso o número do bot tenha sido adicionado por engano)
    if (numero === botJid) {
      console.warn(`⚠️ Pulando envio. O próprio número do BOT (${numero}) está na lista de destinatários.`);
      continue; 
    }
    
    try {
      await sock.sendMessage(numero, { text: mensagem });
      console.log(`📤 Mensagem "${mensagem}" enviada com sucesso para o DESTINATÁRIO: ${numero}`);
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${numero}:`, err.message);
    }
  }
  
  console.log('--- ENVIO DE MENSAGENS CONCLUÍDO ---\n');
}
