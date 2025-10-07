<?php 
include_once('api_connection.php');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    mysqli_query($con, "SET NAMES utf8");

    $colony_entry_id = isset($_POST['colony_entry_id']) ? (int)$_POST['colony_entry_id'] : 0;

    if ($colony_entry_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid or missing colony_entry_id"
        ]);
        exit;
    }

    $res = mysqli_query($con, "SELECT * FROM voter_entry WHERE colony_entry_id = $colony_entry_id AND status = 'Active'");
    $voters = mysqli_fetch_all($res, MYSQLI_ASSOC);

    foreach ($voters as &$row) {
        if (isset($row['voter_id'])) $row['voter_id'] = (int)$row['voter_id'];
        if (isset($row['colony_entry_id'])) $row['colony_entry_id'] = (int)$row['colony_entry_id'];
        if (isset($row['user_id'])) $row['user_id'] = (int)$row['user_id'];
    }

    echo json_encode([
        "success" => true,
        "count" => count($voters),
        "data" => $voters
    ]);

} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method"
    ]);
}
?>
