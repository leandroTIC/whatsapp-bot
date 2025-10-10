<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Enviar WhatsApp pelo Bot</title>
</head>
<body>
    <h2>Enviar WhatsApp via Bot</h2>
    <form method="post">
        <label>Número do destinatário (somente dígitos, ex: 5577981434412):</label><br>
        <input type="text" name="numero" required><br><br>

        <label>Mensagem:</label><br>
        <textarea name="mensagem" rows="4" cols="50" required></textarea><br><br>

        <button type="submit">Enviar</button>
    </form>

    <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $numero = $_POST['numero'];
        $mensagem = $_POST['mensagem'];

        // Chamada HTTP para o bot Node.js
        $url = "http://localhost:10000/send-message"; // ajuste se o Node estiver em outro host/porta
        $data = json_encode([
            "numero" => $numero,
            "mensagem" => $mensagem
        ]);

        $options = [
            "http" => [
                "header" => "Content-Type: application/json\r\n",
                "method" => "POST",
                "content" => $data
            ]
        ];

        $context = stream_context_create($options);
        $result = file_get_contents($url, false, $context);

        if ($result === FALSE) {
            echo "<p style='color:red;'>❌ Erro ao enviar mensagem.</p>";
        } else {
            $response = json_decode($result, true);
            if (isset($response['success'])) {
                echo "<p style='color:green;'>✅ Mensagem enviada para {$response['to']}: {$response['message']}</p>";
            } else {
                echo "<p style='color:red;'>❌ Erro: {$response['error']}</p>";
            }
        }
    }
    ?>
</body>
</html>
