<?php
  $db = "u743335965_voters"; //database name
  $dbuser = "u743335965_voters"; //database username
  $dbpassword = "Weclocks@123"; //database password
//   $dbhost = "89.117.188.154"; //database host
  $dbhost = "82.25.121.33"; //database host

$con = mysqli_connect($dbhost, $dbuser, $dbpassword, $db);
if (!$con) {
    die("Connection failed: " . mysqli_connect_error());
} else {
    // Connection successful
}

?>
