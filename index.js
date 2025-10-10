import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json());

let browser;
let page;

// Inicializa o WhatsApp Web via Puppeteer
async function startBot() {
    browser = await puppeteer.launch({ headless: false }); // headless: false para visualizar
    page = await browser.newPage();
    await page.goto("https://web.whatsapp.com");
    console.log("📱 Abra o QR Code no WhatsApp Web e escaneie para conectar.");
}

startBot();

// Rota POST para enviar mensagem
app.post("/send-message", async (req, res) => {
    const { numero, mensagem } = req.body;

    if (!numero || !mensagem) {
        return res.status(400).json({ error: "Número e mensagem são obrigatórios" });
    }

    try {
        const url = `https://web.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`;

        await page.goto(url);
        await page.waitForTimeout(5000); // espera página carregar

        // Pressiona ENTER para enviar a mensagem
        await page.keyboard.press("Enter");
        await page.waitForTimeout(2000);

        console.log(`📤 Mensagem enviada para ${numero}: "${mensagem}"`);
        return res.json({ success: true, numero, mensagem });
    } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err);
        return res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT || 10000, () => {
    console.log("🌐 Bot rodando em http://localhost:10000");
});
