<?php
//   $db = "u743335965_scheme_track"; //database name
//   $dbuser = "u743335965_scheme_track"; //database username
//   $dbpassword = "Weclocks@1803"; //database password
//   $dbhost = "89.117.188.154"; //database host

// $con = mysqli_connect($dbhost, $dbuser, $dbpassword, $db); 

// if ($con) {
//     header('Content-Type: application/json');
//     if($_SERVER['REQUEST_METHOD'] == "GET"){
    
//     mysqli_query($con,"set names utf8");
    
//         $res=mysqli_query($con,"SELECT * FROM grampanchyat");
//         $response = mysqli_fetch_all($res,MYSQLI_ASSOC);
        
//         foreach ($response as &$row) {
//             if (isset($row['gp_id'])) $row['gp_id'] = (int)$row['gp_id'];
//         }
        
//         echo json_encode($response);
    	
    
//     }
// }

$db = "u485062831_ndbitdpd"; //database name
  $dbuser = "u485062831_ndbitdpu"; //database username
  $dbpassword = "U=v28Ijc>2"; //database password
  $dbhost = "89.117.27.52"; //database host

$con = mysqli_connect($dbhost, $dbuser, $dbpassword, $db); 

if ($con) {
    header('Content-Type: application/json');
    if($_SERVER['REQUEST_METHOD'] == "GET"){
    
    mysqli_query($con,"set names utf8");
    
        $res=mysqli_query($con,"select * from tbl_category where maintanance='Yes' and status='Active'");
        $response = mysqli_fetch_all($res,MYSQLI_ASSOC);
        
        // foreach ($response as &$row) {
        //     if (isset($row['gp_id'])) $row['gp_id'] = (int)$row['gp_id'];
        // }
        
        echo json_encode($response);
    	
    
    }
}
else {
    echo "Error";
}

?>