<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$ADMIN_TOKEN = 'Gab_2025_superSecret!'; // <<< change-moi

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body) || !isset($body['token']) || $body['token'] !== $ADMIN_TOKEN) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
}
$data = isset($body['data']) && is_array($body['data']) ? $body['data'] : [];
$file = __DIR__ . '/taplavion_config.json';
$ok = @file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT), LOCK_EX);
if ($ok === false) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'write_failed']); exit; }
echo json_encode(['ok'=>true]);
