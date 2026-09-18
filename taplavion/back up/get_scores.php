<?php
// plantager/get_scores.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$file = __DIR__ . DIRECTORY_SEPARATOR . 'scores.txt';

$results = [];
if (is_file($file)) {
  $lines = @file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  if ($lines !== false) {
    foreach ($lines as $ln) {
      $obj = json_decode($ln, true);
      if (is_array($obj) && isset($obj['name'], $obj['score'])) {
        $results[] = $obj;
      }
    }
  }
}

// Trie et limite
usort($results, function($a, $b) {
  return ($b['score'] <=> $a['score']) ?: (($a['t'] ?? 0) <=> ($b['t'] ?? 0));
});
$results = array_slice($results, 0, 20);

echo json_encode(['ok' => true, 'top' => $results], JSON_UNESCAPED_UNICODE);
