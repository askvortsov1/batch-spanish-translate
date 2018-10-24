<?php
$key = file_get_contents('secret.key');
$lang = 'es-en';
$url = 'https://translate.yandex.net/api/v1.5/tr.json/translate';
$text = urlencode($_GET['text']);
if ($_GET['lang']) {
    $lang = $_GET['lang'];
}
$data = array('key' => $key, 'text' => $text, 'lang' => $lang);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'GET',
        'content' => http_build_query($data)
    )
);
$context  = stream_context_create($options);
$result = json_decode(file_get_contents($url, false, $context), true)["text"][0];
echo $result;
?>