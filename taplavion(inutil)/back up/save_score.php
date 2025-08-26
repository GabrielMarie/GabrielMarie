<?php
// plantager/save_score.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dir = __DIR__;
$file = $dir . DIRECTORY_SEPARATOR . 'scores.txt';

// Paramètres attendus (POST)
$name  = isset($_POST['name'])  ? trim($_POST['name']) : '';
$score = isset($_POST['score']) ? intval($_POST['score']) : 0;

// Sanitize / limites
if ($name === '') { $name = 'Anonyme'; }
$name = mb_substr($name, 0, 20, 'UTF-8');
if ($score < 0) { $score = 0; }
if ($score > 1000000) { $score = 1000000; } // garde-fou

$entry = [
  't'     => time(),
  'name'  => $name,
  'score' => $score,
  'ip'    => $_SERVER['REMOTE_ADDR'] ?? ''
];

// Écrit en JSON Lines (une ligne JSON par score)
$line = json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL;
$ok = @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);

if ($ok === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'write_failed']);
  exit;
}

echo json_encode(['ok' => true]);
