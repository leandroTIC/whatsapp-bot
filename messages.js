class Messages {
    messages = {
        '0': '❌ Opção inválida. Digite "menu" para ver as opções novamente.',
        '1': `🕒 Nosso horário de atendimento é:
                Seg-Sex: 09h às 18h
                Sáb: 09h às 12h\n\nDigite "menu" para retornar ao início`,
        '2': '📞 Um atendente será chamado. Por favor, aguarde...',
        '3': `💼 Nossos serviços:
            - Desenvolvimento de Sites
            - Chatbots para WhatsApp
            - Marketing Digital\n\nDigite "menu" para retornar ao início`,
        '4': `📍 Nossa localização:
                Rua Exemplo, 123 - Centro, São Paulo - SP\n\nDigite "menu" para retornar ao início`,
        '5': `💳 Aceitamos pagamentos via:
            - Pix
            - Cartão de Crédito/Débito
            - Boleto Bancário\n\nDigite "menu" para retornar ao início`,
        '6': `🚀 Trabalhe conosco:
                Envie seu currículo para: talentos@exemplo.com\n\nDigite "menu" para retornar ao início`,
        '7': 'Atendimento automático foi reativado para este número',
        '10': `👋 Olá! Seja bem-vindo ao atendimento automático:

            1️⃣ - Ver horário de atendimento
            2️⃣ - Falar com atendente
            3️⃣ - Ver nossos serviços
            4️⃣ - Ver localização
            5️⃣ - Formas de pagamento
            6️⃣ - Trabalhe conosco

            Digite a opção desejada:`
    }

    getMessage(index = 0) {
        return this.messages[index.toString()] ?? this.messages['0'];
    }
}

module.exports = new Messages();