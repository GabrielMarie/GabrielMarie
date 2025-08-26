<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$ADMIN_TOKEN = 'Gab_2025_superSecret!';

function jout($arr){ echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }
function elog($msg){
  $dir = __DIR__ . '/data';
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  @file_put_contents($dir.'/debug.log', '['.date('c')."] ".$msg."\n", FILE_APPEND);
}

try {
  $token = $_POST['token'] ?? '';
  $data  = null;

  if (isset($_POST['data'])) {
    $data = json_decode($_POST['data'], true);
  } else if (isset($_GET['data'])) {
    $token = $token ?: ($_GET['token'] ?? '');
    $data  = json_decode($_GET['data'], true);
  } else {
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
    jout(['ok'=>false,'error'=>'unauthorized']);
  }
  if (!is_array($data)) {
    elog('no_data: token OK mais data vide'); 
    throw new Exception('no_data');
  }

  $dir = __DIR__ . '/data';
  if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
    elog('mkdir_failed: '.$dir);
    throw new Exception('mkdir_failed');
  }
  $file = $dir . '/taplavion_config.json';

  if (@file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT), LOCK_EX) === false) {
    elog('write_failed: '.$file);
    throw new Exception('write_failed');
  }
  @chmod($file, 0664);

  jout(['ok'=>true]);

} catch (Exception $e) {
  http_response_code(500);
  jout(['ok'=>false,'error'=>'save_config_failed','error_details'=>$e->getMessage()]);
}
