<?php
// taplavion/api.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$ADMIN_TOKEN = 'Gab_2025_superSecret!'; // <<< même valeur que dans le HTML
$DATA_DIR = __DIR__ . '/data';
$SCORES   = $DATA_DIR . '/scores.json';

// helpers
function out($arr){ echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }
function rdjson($file){
  return is_file($file) ? (json_decode(@file_get_contents($file), true) ?: []) : [];
}
function wrjson($file, $data){
  if (!is_dir(dirname($file))) @mkdir(dirname($file), 0775, true);
  if (@file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT), LOCK_EX) === false) {
    out(['ok'=>false,'error'=>'write_failed']);
  }
  @chmod($file, 0664);
}

$a = $_GET['a'] ?? $_POST['a'] ?? '';
$now = time();

switch ($a) {
  // Lire scores (Top 20)
  case 'gs': {
    $arr = rdjson($SCORES);
    usort($arr, fn($x,$y)=>($y['score']??0)-($x['score']??0));
    $arr = array_slice($arr, 0, 20);
    out(['ok'=>true,'top'=>$arr]);
  }

  // Enregistrer un score
  case 'ss': {
    $name  = trim($_POST['name'] ?? '');
    $score = intval($_POST['score'] ?? 0);
    if ($name === '') $name = 'Anonyme';
    $arr = rdjson($SCORES);
    $arr[] = ['name'=>mb_substr($name,0,20),'score'=>$score,'t'=>$now];
    if (count($arr) > 500) { $arr = array_slice($arr, -500); } // bornes
    wrjson($SCORES, $arr);
    out(['ok'=>true]);
  }

  // Supprimer une entrée (timestamp)
  case 'ds': {
    $tok = $_POST['token'] ?? '';
    if ($tok !== $ADMIN_TOKEN) out(['ok'=>false,'error'=>'unauthorized']);
    $t = intval($_POST['t'] ?? 0);
    $arr = rdjson($SCORES);
    $arr = array_values(array_filter($arr, fn($e)=>($e['t']??0)!==$t));
    wrjson($SCORES, $arr);
    out(['ok'=>true]);
  }

  // Vider tous les scores
  case 'cl': {
    $tok = $_POST['token'] ?? '';
    if ($tok !== $ADMIN_TOKEN) out(['ok'=>false,'error'=>'unauthorized']);
    wrjson($SCORES, []);
    out(['ok'=>true]);
  }

  default:
    out(['ok'=>false,'error'=>'unknown_action']);
}
