import express from 'express'
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import qrcode from 'qrcode'

const app = express()
const PORT = process.env.PORT || 10000

let sock
let lastQR = null

const numeros = [
  '5577981434412@s.whatsapp.net', // sua esposa
  '5577981145420@s.whatsapp.net'  // outro número
]


// Mensagem a ser enviada
const mensagem = 'Olá 👋 sua mensagem foi enviada com sucesso!'

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
  try {
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
        setTimeout(startBot, 5000) // espera 5s antes de reconectar
      }
    })
  } catch (err) {
    console.error('❌ Erro ao iniciar o bot:', err)
  }
}

// Função para enviar mensagem para todos os números
function enviarMensagem() {
  if (!sock || !sock.user) {
    console.log('WhatsApp não conectado ainda.')
    return
  }

  numeros.forEach(numero => {
    sock.sendMessage(numero, { text: mensagem })
      .then(() => console.log(`✅ Mensagem enviada para ${numero.replace('@s.whatsapp.net','')}`))
      .catch(err => console.error(`❌ Erro ao enviar mensagem para ${numero}:`, err))
  })
}
