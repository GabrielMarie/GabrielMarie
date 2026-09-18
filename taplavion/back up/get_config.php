<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$file = __DIR__ . '/taplavion_config.json';
$defaults = [
  "SCALE"=>2, "MAX_PLANES"=>7, "DIVE_CHANCE"=>0.20, "DIVE_ANGLE"=>20, "DIVE_SPEED"=>60,
  "spawnEveryMs"=>1100, "spawnRamp"=>0.997, "uTurnChance"=>0.15, "chainRadius"=>110,
  "medicChance"=>0.02, "bannerChance"=>1/12, "trumpChance"=>1/40
];
if (!is_file($file)) {
  echo json_encode(["ok"=>true, "data"=>$defaults]); exit;
}
$json = @file_get_contents($file);
$data = json_decode($json, true);
if (!is_array($data)) { $data = $defaults; }
echo json_encode(["ok"=>true, "data"=>$data], JSON_UNESCAPED_UNICODE);
