<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Enviar WhatsApp pelo Bot</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-6">

            <div class="card shadow-sm">
                <div class="card-header bg-success text-white text-center">
                    <h3>Enviar WhatsApp via Bot</h3>
                </div>
                <div class="card-body">
                    <form method="post">
                        <div class="mb-3">
                            <label for="numero" class="form-label">Número do destinatário (somente dígitos, ex: 5577981434412):</label>
                            <input type="text" class="form-control" id="numero" name="numero" required>
                        </div>

                        <div class="mb-3">
                            <label for="mensagem" class="form-label">Mensagem:</label>
                            <textarea class="form-control" id="mensagem" name="mensagem" rows="4" required></textarea>
                        </div>

                        <div class="d-grid">
                            <button type="submit" class="btn btn-success">Enviar</button>
                        </div>
                    </form>

                    <?php
                    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                        $numero = $_POST['numero'];
                        $mensagem = $_POST['mensagem'];

                        // Chamada HTTP para o bot Node.js
                        $url = "http://localhost:10000/send-message"; // ajuste conforme seu host/porta
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
                        $result = @file_get_contents($url, false, $context);

                        if ($result === FALSE) {
                            echo '<div class="alert alert-danger mt-3" role="alert">❌ Erro ao enviar mensagem.</div>';
                        } else {
                            $response = json_decode($result, true);
                            if (isset($response['success']) && $response['success']) {
                                echo '<div class="alert alert-success mt-3" role="alert">';
                                echo "✅ Mensagem enviada para <strong>{$numero}</strong>: {$mensagem}";
                                echo '</div>';
                            } else {
                                $erroMsg = $response['error'] ?? 'Erro desconhecido.';
                                echo '<div class="alert alert-danger mt-3" role="alert">';
                                echo "❌ Erro: {$erroMsg}";
                                echo '</div>';
                            }
                        }
                    }
                    ?>
                </div>
            </div>

        </div>
    </div>
</div>

<!-- Bootstrap JS (opcional, para componentes interativos) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
