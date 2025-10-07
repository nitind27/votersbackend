<?php 
include_once('api_connection.php');
header('Content-Type: application/json');
if($_SERVER['REQUEST_METHOD'] == "POST"){

mysqli_query($con,"set names utf8");

    $colony_id = isset($_POST['colony_id']) ? $_POST['colony_id'] : 0;
    
    $sql = "SELECT colony_entry_id FROM colony_entry WHERE colony_id IN ($colony_id) AND status = 'Active'";
    $res = mysqli_query($con, $sql);
    $sqlRres = mysqli_fetch_all($res,MYSQLI_ASSOC);
    $ids = array_column($sqlRres, 'colony_entry_id');
    $joined_ids = implode(',', $ids);

    $res=mysqli_query($con,"SELECT * FROM voter_entry where colony_entry_id IN ($joined_ids) AND status = 'Active'");
    $response = mysqli_fetch_all($res,MYSQLI_ASSOC);
    
    foreach ($response as &$row) {
        if (isset($row['voter_id'])) $row['voter_id'] = (int)$row['voter_id'];
        if (isset($row['colony_entry_id'])) $row['colony_entry_id'] = (int)$row['colony_entry_id'];
        if (isset($row['user_id'])) $row['user_id'] = (int)$row['user_id'];
    }
    
    echo json_encode($response);
	

}
?>