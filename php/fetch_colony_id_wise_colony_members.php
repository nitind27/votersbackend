<?php
include_once('api_connection.php');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    mysqli_query($con, "SET NAMES utf8");
    
    // Validate colony_entry_id
    $colony_id = isset($_POST['colony_id']) ? $_POST['colony_id'] : 0;
    if ($colony_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid or missing colony_id"
        ]);
        exit;
    }
    
    // Fetch all voter entries for given colony_entry_id with status='Active'
    $sql = "SELECT * FROM colony_member WHERE colony_id IN ($colony_id) AND status = 'Active'";
    $res = mysqli_query($con, $sql);
    
    if ($res) {
        $colonyMembers = [];
        while ($row = mysqli_fetch_assoc($res)) {
            // Proper typecast for integer fields
            if (isset($row['colony_member_id'])) $row['colony_member_id'] = (int)$row['colony_member_id'];
            if (isset($row['colony_id'])) $row['colony_id'] = (int)$row['colony_id'];
            $colonyMembers[] = $row;
        }
        echo json_encode([
            "success" => true,
            "count" => count($colonyMembers),
            "data" => $colonyMembers
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Database query failed"
        ]);
    }
    
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method"
    ]);
}
?>
