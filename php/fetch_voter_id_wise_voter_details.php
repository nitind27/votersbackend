<?php
include_once('api_connection.php');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    mysqli_query($con, "SET NAMES utf8");

    // voter_id validation
    $voter_id = isset($_POST['voter_id']) && is_numeric($_POST['voter_id']) ? (int)$_POST['voter_id'] : 0;

    if ($voter_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid or missing voter_id"
        ]);
        exit;
    }

    // Status चेक अगर voter_entry टेबल में status कॉलम है
    // केवल Active रिकॉर्ड लेना है
    $sql = "SELECT * FROM voter_entry WHERE voter_id = $voter_id AND status = 'Active' LIMIT 1";
    $res = mysqli_query($con, $sql);

    if ($res && mysqli_num_rows($res) > 0) {
        $voter = mysqli_fetch_assoc($res);

        // Proper typecasting
        if (isset($voter['voter_id'])) $voter['voter_id'] = (int)$voter['voter_id'];
        if (isset($voter['colony_entry_id'])) $voter['colony_entry_id'] = (int)$voter['colony_entry_id'];
        if (isset($voter['user_id'])) $voter['user_id'] = (int)$voter['user_id'];

        echo json_encode([
            "success" => true,
            "data" => $voter
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Voter not found"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method"
    ]);
}
?>
