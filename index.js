import express from 'express'
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import qrcode from 'qrcode'

const app = express()
const PORT = process.env.PORT || 10000

let sock
let lastQR = null

// Rota para exibir QR no navegador
app.get('/qrcode', async (req, res) => {
  if (!lastQR) return res.send('QR Code ainda não gerado. Aguarde alguns segundos.')
  const qrImg = await qrcode.toDataURL(lastQR)
  res.send(`<h2>Escaneie o QR Code com o WhatsApp</h2><img src="${qrImg}" />`)
})

// Rota de teste do bot
app.get('/', (req, res) => res.send('Bot WhatsApp rodando ✅'))

app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`)
  startBot()
})

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

  sock = makeWASocket({
    auth: state
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update

    if (qr) {
      lastQR = qr // salva o QR para a rota
      console.log('QR Code gerado! Acesse /qrcode no navegador para escanear.')
    }

    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!')
      enviarMensagem()
    } else if (connection === 'close') {
      console.log('⚠ Conexão caiu, tentando reconectar...')
      startBot()
    }
  })
}

// Envia mensagem para o número especificado
function enviarMensagem() {
  const numero = '5577988556030@s.whatsapp.net' // Seu número
  const mensagem = 'Olá Leandro 👋 Esta é uma mensagem automática de teste!'

  sock.sendMessage(numero, { text: mensagem })
    .then(() => console.log('✅ Mensagem enviada para 77988556030'))
    .catch(err => console.error('❌ Erro ao enviar mensagem:', err))
}
