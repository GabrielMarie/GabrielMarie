<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$ADMIN_TOKEN = 'Gab_2025_superSecret!'; // ton token

try {
  // 1) Récup token + data depuis FormData (POST) si dispo
  $token = $_POST['token'] ?? '';
  $data  = null;

  if (isset($_POST['data'])) {
    $data = json_decode($_POST['data'], true);
  } else {
    // 2) Sinon, essayer JSON brut
    $raw = file_get_contents('php://input');
    if ($raw) {
      $body = json_decode($raw, true);
      if (is_array($body)) {
        $token = $token ?: ($body['token'] ?? '');
        $data  = $body['data']  ?? null;
      }
    }
  }

  if ($token !== $ADMIN_TOKEN) {
    http_response_code(401);
    echo json_encode(['ok'=>false,'error'=>'unauthorized']);
    exit;
  }
  if (!is_array($data)) {
    throw new Exception('no_data');
  }

  $dir = __DIR__ . '/data';
  if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
    throw new Exception('mkdir_failed');
  }
  $file = $dir . '/taplavion_config.json';

  if (@file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT), LOCK_EX) === false) {
    throw new Exception('write_failed');
  }
  @chmod($file, 0664);

  echo json_encode(['ok'=>true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'save_config_failed','error_details'=>$e->getMessage()]);
}
