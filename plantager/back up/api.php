<?php
// taplavion/api.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// === CONFIG ===
$ADMIN_TOKEN = 'Gab_2025_superSecret!'; // le tien
$DATA_DIR = __DIR__ . '/data';
$SCORES   = $DATA_DIR . '/scores.json';
$CONFIG   = $DATA_DIR . '/taplavion_config.json';

// Helpers
function out($arr){ echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }
function rdjson($file){ return is_file($file) ? (json_decode(@file_get_contents($file), true) ?: []) : []; }
function wrjson($file, $data){
  if (!is_dir(dirname($file))) @mkdir(dirname($file), 0775, true);
  if (@file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT), LOCK_EX) === false) {
    out(['ok'=>false,'error'=>'write_failed']);
  }
  @chmod($file, 0664);
}

// Inputs
$a = $_GET['a'] ?? $_POST['a'] ?? '';
$now = time();

// Routes par codes courts (évite "delete/config/save" dans l’URL)
switch ($a) {
  // --- Scores ---
  case 'gs': { // get scores
    $arr = rdjson($SCORES);
    // tri décroissant et top 20
    usort($arr, fn($x,$y)=>($y['score']??0)-($x['score']??0));
    $arr = array_slice($arr, 0, 20);
    out(['ok'=>true,'top'=>$arr]);
  }

  case 'ss': { // save score (POST)
    $name  = trim($_POST['name'] ?? '');
    $score = intval($_POST['score'] ?? 0);
    if ($name === '') $name = 'Anonyme';
    $arr = rdjson($SCORES);
    $arr[] = ['name'=>mb_substr($name,0,20),'score'=>$score,'t'=>$now];
    // garder taille raisonnable
    if (count($arr) > 500) { $arr = array_slice($arr, -500); }
    wrjson($SCORES, $arr);
    out(['ok'=>true]);
  }

  // --- Config ---
  case 'gc': { // get config
    $cfg = rdjson($CONFIG);
    out(['ok'=>true,'data'=>$cfg]);
  }
  case 'sc': { // set config (token)
    $tok = $_POST['token'] ?? $_GET['token'] ?? '';
    if ($tok !== $ADMIN_TOKEN) out(['ok'=>false,'error'=>'unauthorized']);
    $raw = $_POST['data'] ?? $_GET['data'] ?? '';
    $data = json_decode($raw, true);
    if (!is_array($data)) out(['ok'=>false,'error'=>'no_data']);
    wrjson($CONFIG, $data);
    out(['ok'=>true]);
  }

  // --- Admin scores (token) ---
  case 'ds': { // delete one by timestamp
    $tok = $_POST['token'] ?? $_GET['token'] ?? '';
    if ($tok !== $ADMIN_TOKEN) out(['ok'=>false,'error'=>'unauthorized']);
    $t = intval($_POST['t'] ?? $_GET['t'] ?? 0);
    $arr = rdjson($SCORES);
    $arr = array_values(array_filter($arr, fn($e)=>($e['t']??0)!==$t));
    wrjson($SCORES, $arr);
    out(['ok'=>true]);
  }
  case 'cl': { // clear all
    $tok = $_POST['token'] ?? $_GET['token'] ?? '';
    if ($tok !== $ADMIN_TOKEN) out(['ok'=>false,'error'=>'unauthorized']);
    wrjson($SCORES, []);
    out(['ok'=>true]);
  }

  default:
    out(['ok'=>false,'error'=>'unknown_action']);
}
