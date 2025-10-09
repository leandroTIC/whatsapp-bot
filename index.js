import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 10000

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)

  // Quando a conexão for aberta = logado ✅
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!')

      // Exemplo: envia mensagem automática após logar
      enviarMensagemAutomatica(sock)
    }
  })
}

function enviarMensagemAutomatica(sock) {
  const numero = '5577981145420@s.whatsapp.net' // formato correto com DDI e DDD
  const mensagem = 'Olá 👋 Esta é uma mensagem automática!'

  sock.sendMessage(numero, { text: mensagem })
    .then(() => console.log('✅ Mensagem enviada com sucesso!'))
    .catch((err) => console.error('❌ Erro ao enviar mensagem:', err))
}

app.get('/', (req, res) => {
  res.send('Bot WhatsApp rodando ✅')
})

app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`)
  startBot()
})
