import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import express from 'express'
import QRCode from 'qrcode'

const app = express()
const PORT = process.env.PORT || 10000

let sock // socket global

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      // gera QR Code em URL para navegador
      const qrDataUrl = await QRCode.toDataURL(qr)
      console.log('⚡ QR Code gerado! Acesse /qrcode para escanear')
      sock.qrDataUrl = qrDataUrl // guarda para servir na rota
    }

    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!')
      enviarMensagemAutomatica(sock)
    } else if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) {
        console.log('⚠ Conexão caiu. Tentando reconectar...')
        startBot()
      } else {
        console.log('❌ Desconectado. Faça login novamente.')
      }
    }
  })
}

// função para enviar mensagem automática
function enviarMensagemAutomatica(sock) {
  if (!sock || !sock.authState) return console.log('Socket não está pronto')

  const numero = '5577988556030@s.whatsapp.net' // número desejado
  const mensagem = 'Olá 👋 Esta é uma mensagem automática!'

  sock.sendMessage(numero, { text: mensagem })
    .then(() => console.log('✅ Mensagem enviada com sucesso!'))
    .catch(err => console.error('❌ Erro ao enviar mensagem:', err))
}

// rota principal para testar
app.get('/', (req, res) => {
  res.send('Bot WhatsApp rodando ✅')
})

// rota para QR Code
app.get('/qrcode', (req, res) => {
  if (sock?.qrDataUrl) {
    res.send(`<img src="${sock.qrDataUrl}" />`)
  } else {
    res.send('QR Code ainda não gerado. Atualize em alguns segundos.')
  }
})

// inicializa servidor e bot
app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`)
  startBot()
})
