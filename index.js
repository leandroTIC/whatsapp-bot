import express from "express";
import fs from "fs";
// Importamos jidNormalizedUser para limpar o JID do bot (remover o ':26', etc.)
import makeWASocket, { useMultiFileAuthState, DisconnectReason, jidNormalizedUser } from "@whiskeysockets/baileys";
import qrcode from "qrcode";

const app = express();
const PORT = process.env.PORT || 10000;

let sock;       // Conexão com o WhatsApp
let lastQR = null; // Guarda o QR gerado para exibir no navegador
// botJid agora guarda o JID LIMPO (ex: 5577988556030@s.whatsapp.net)
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
      // 💡 CORREÇÃO: Usamos jidNormalizedUser para garantir que botJid
      // tenha o formato 55xxxxxxxxxxx@s.whatsapp.net, igual aos destinatários.
      botJid = jidNormalizedUser(sock.user.id); 
      console.log(`✅ Conectado ao WhatsApp com sucesso! REMETENTE NORMALIZADO: ${botJid}`);
      
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
  // Por favor, **SUBSTITUA** esses exemplos pelos números REAIS
  // dos seus destinatários, garantindo que não é o número do bot.
  const destinatarios = [
    "5577981434412@s.whatsapp.net", // Exemplo de um destinatário
    "5577981145420@s.whatsapp.net"  // Exemplo de outro destinatário
  ];

  const mensagem = "👋 Esta é uma mensagem automática enviada pelo BOT oficial +55 77 98855-6030 ✅";
  
  console.log(`\n--- INICIANDO ENVIO DE MENSAGENS (Remetente Normalizado: ${botJid}) ---`);

  for (const numero of destinatarios) {
    // ✅ VERIFICAÇÃO DE SEGURANÇA: A comparação agora é confiável.
    if (numero === botJid) {
      console.warn(`⚠️ Pulando envio. O próprio número do BOT (${numero}) está na lista de destinatários.`);
      continue; 
    }
    
    try {
      await sock.sendMessage(numero, { text: mensagem });
      console.log(`📤 Mensagem enviada com sucesso para o DESTINATÁRIO: ${numero}`);
    } catch (err) {
      console.error(`❌ Erro ao enviar para ${numero}:`, err.message);
    }
  }
  
  console.log('--- ENVIO DE MENSAGENS CONCLUÍDO ---\n');
}
