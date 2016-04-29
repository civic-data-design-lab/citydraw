<?php
   header("Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0");//Dont cache

include 'cartoDBProxy.php';
//			^CHANGE THIS TO THE PATH TO YOUR cartodbProxy.php
$queryURL = $_POST['qurl'];
$return = goProxy($queryURL);
echo $return;
?>