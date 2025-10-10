import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 10000

let sock // variável global do socket

const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  })

  sock = makeWASocket({ auth: state, printQRInTerminal: true })
  sock.ev.on('creds.update', saveCreds)

  // Quando a conexão for aberta = logado ✅
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    const { connection } = update
    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!')

      // Exemplo: envia mensagem automática após logar
      enviarMensagemAutomatica(sock)
      // Agora podemos enviar mensagens
      enviarMensagemAutomatica()
    } else if (connection === 'close') {
      console.log('⚠ Conexão caiu, tentando reconectar...')
      startBot() // reconecta automaticamente
    }
  })
}

function enviarMensagemAutomatica(sock) {
  const numero = '5577988556030@s.whatsapp.net' // formato correto com DDI e DDD
function enviarMensagemAutomatica() {
  if (!sock || !sock.authState) return console.log('Socket não está pronto')

  const numero = '5577981145420@s.whatsapp.net' // exemplo
  const mensagem = 'Olá 👋 Esta é uma mensagem automática!'

  sock.sendMessage(numero, { text: mensagem })
    .then(() => console.log('✅ Mensagem enviada com sucesso!'))
    .catch((err) => console.error('❌ Erro ao enviar mensagem:', err))
    .catch(err => console.error('❌ Erro ao enviar mensagem:', err))
}

app.get('/', (req, res) => {
  res.send('Bot WhatsApp rodando ✅')
})
app.get('/', (req, res) => res.send('Bot WhatsApp rodando ✅'))

app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`)
  startBot()
})
