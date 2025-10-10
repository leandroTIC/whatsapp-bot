<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Enviar WhatsApp pelo Bot</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container mt-5">
    <h2 class="mb-4">Enviar WhatsApp via Bot</h2>

    <form method="post" class="mb-4">
        <div class="mb-3">
            <label class="form-label">Número do destinatário (ex: 5577981434412):</label>
            <input type="text" name="numero" class="form-control" required>
        </div>

        <div class="mb-3">
            <label class="form-label">Mensagem:</label>
            <textarea name="mensagem" class="form-control" rows="4" required></textarea>
        </div>

        <button type="submit" class="btn btn-primary">Enviar</button>
    </form>

    <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $numero = $_POST['numero'];
        $mensagem = $_POST['mensagem'];

        $url = "http://whatsapp-bot-2pdg.onrender.com/send-message"; // URL do seu Node.js
        $data = json_encode([
            "numero" => $numero,
            "mensagem" => $mensagem
        ]);

        $options = [
            "http" => [
                "header" => "Content-Type: application/json\r\n",
                "method" => "POST",
                "content" => $data,
                "ignore_errors" => true // Para capturar erros HTTP
            ]
        ];

        $context = stream_context_create($options);
        $result = file_get_contents($url, false, $context);

        echo "<div class='mt-3'>";
        if ($result === FALSE) {
            echo "<div class='alert alert-danger'>❌ Erro ao enviar mensagem. Verifique a URL do bot ou a conexão.</div>";
        } else {
            $response = json_decode($result, true);
            if (isset($response['success']) && $response['success'] === true) {
                echo "<div class='alert alert-success'>✅ Mensagem enviada para <strong>{$response['numero']}</strong>: {$response['mensagem']}</div>";
            } else {
                $erro = $response['error'] ?? 'Erro desconhecido';
                echo "<div class='alert alert-danger'>❌ Erro do bot: {$erro}</div>";
            }
        }
        echo "</div>";
    }
    ?>
</div>
</body>
</html>
