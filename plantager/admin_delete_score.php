<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$ADMIN_TOKEN = 'Gab_2025_superSecret!'; // <<< change-moi

if (($_POST['token'] ?? '') !== $ADMIN_TOKEN) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
}

$file = __DIR__ . '/scores.txt';
if (!is_file($file)) { touch($file); }

if (!empty($_POST['clear'])) {
  // vider
  $ok = @file_put_contents($file, '', LOCK_EX);
  echo json_encode(['ok'=> $ok !== false]); exit;
}

$t = isset($_POST['t']) ? intval($_POST['t']) : 0;
$lines = @file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if ($lines === false) { echo json_encode(['ok'=>false,'error'=>'read_failed']); exit; }

$out = [];
foreach ($lines as $ln) {
  $obj = json_decode($ln, true);
  if (!is_array($obj) || !isset($obj['t'])) continue;
  if (intval($obj['t']) === $t) continue; // skip (delete)
  $out[] = json_encode($obj, JSON_UNESCAPED_UNICODE);
}
$ok = @file_put_contents($file, implode(PHP_EOL, $out) . (count($out)?PHP_EOL:''), LOCK_EX);
echo json_encode(['ok'=> $ok !== false]);
