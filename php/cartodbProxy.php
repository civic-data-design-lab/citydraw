<?php
session_cache_limiter('nocache');
$cache_limiter = session_cache_limiter();
function goProxy($dataURL) 
{
	$baseURL = 'http://mjfoster83.cartodb.com/api/v2/sql?';
	//  					^ CHANGE THE 'CARTODB-USER-NAME' to your cartoDB url!
	$api = '&api_key=4fe75108b6d2400f6406c390e49a815f2a974d87';
	//				 ^ENTER YOUR API KEY HERE!
	$url = $baseURL.'q='.urlencode($dataURL).$api;
	$result = file_get_contents ($url);
	return $result;
}
?>