import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 10000

let sock // variável global do socket

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

  sock = makeWASocket({ auth: state, printQRInTerminal: true })
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection } = update
    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!')

      // Agora podemos enviar mensagens
      enviarMensagemAutomatica()
    } else if (connection === 'close') {
      console.log('⚠ Conexão caiu, tentando reconectar...')
      startBot() // reconecta automaticamente
    }
  })
}

function enviarMensagemAutomatica() {
  if (!sock || !sock.authState) return console.log('Socket não está pronto')

  const numero = '5577981145420@s.whatsapp.net' // exemplo
  const mensagem = 'Olá 👋 Esta é uma mensagem automática!'

  sock.sendMessage(numero, { text: mensagem })
    .then(() => console.log('✅ Mensagem enviada com sucesso!'))
    .catch(err => console.error('❌ Erro ao enviar mensagem:', err))
}

app.get('/', (req, res) => res.send('Bot WhatsApp rodando ✅'))

app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`)
  startBot()
})
