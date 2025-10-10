import express from "express";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Pasta para salvar sessão do WhatsApp Web
const SESSION_PATH = path.join(process.cwd(), "sessions");
if (!fs.existsSync(SESSION_PATH)) fs.mkdirSync(SESSION_PATH);

let browser;
let page;

// Função para iniciar Puppeteer e WhatsApp Web
async function initWhatsApp() {
  browser = await puppeteer.launch({
    headless: false,
    userDataDir: SESSION_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  page = await browser.newPage();
  await page.goto("https://web.whatsapp.com");
  console.log("📱 Acesse o WhatsApp Web e escaneie o QR Code (somente na primeira vez).");

  // Espera WhatsApp Web carregar
  await page.waitForSelector('div[role="textbox"]', { timeout: 0 });
  console.log("✅ WhatsApp Web carregado e pronto para enviar mensagens!");
}

// Função para enviar mensagem
async function sendMessage(numero, mensagem) {
  const url = `https://web.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;
  await page.goto(url);

  // Espera carregar o botão de enviar
  await page.waitForSelector('span[data-icon="send"]', { timeout: 60000 });
  await page.click('span[data-icon="send"]');

  console.log(`📤 Mensagem enviada para ${numero}: "${mensagem}"`);
}

// Rota para testar envio de mensagens
app.post("/send-message", async (req, res) => {
  const { numero, mensagem } = req.body;

  if (!numero || !mensagem) {
    return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
  }

  try {
    await sendMessage(numero, mensagem);
    return res.json({ success: true, numero, mensagem });
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Status do bot
app.get("/", (req, res) => res.send("🤖 Bot WhatsApp rodando com Puppeteer!"));

app.listen(PORT, async () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
  await initWhatsApp();
});
