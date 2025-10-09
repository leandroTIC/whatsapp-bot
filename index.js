import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import http from 'http'

// Cria servidor HTTP básico (Render exige que a porta seja usada)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('🤖 WhatsApp Bot está rodando!\n')
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`)
})

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect.error)).output?.statusCode !== DisconnectReason.loggedOut
      console.log('Conexão caiu, reconectando?', shouldReconnect)
      if (shouldReconnect) startSock()
    } else if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!')
    } else if (connection === 'connecting') {
      console.log('🔄 Conectando ao WhatsApp...')
    }
  })

  // Exemplo de envio automático depois de 10s
  setTimeout(() => {
    const numero = '5599999999999@s.whatsapp.net' // coloque o número de teste aqui
    sock.sendMessage(numero, { text: '📢 Olá, esta é uma mensagem automática do bot Render!' })
  }, 10000)
}

startSock()
