<?php
include_once('api_connection.php');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    mysqli_query($con, "SET NAMES utf8");

    // colony_entry_id validation
    $colony_entry_id = isset($_POST['colony_entry_id']) && is_numeric($_POST['colony_entry_id']) ? (int)$_POST['colony_entry_id'] : 0;
    if ($colony_entry_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid or missing colony_entry_id"
        ]);
        exit;
    }

    // Fetch colony with voter count
    $sql = "
        SELECT 
            ce.*, 
            COUNT(ve.voter_id) AS family_member
        FROM 
            colony_entry ce
        LEFT JOIN 
            voter_entry ve 
        ON 
            ce.colony_entry_id = ve.colony_entry_id
        WHERE 
            ce.colony_entry_id = $colony_entry_id 
            AND ce.status = 'Active'
        GROUP BY 
            ce.colony_entry_id
        LIMIT 1
    ";

    $res = mysqli_query($con, $sql);

    if ($res && mysqli_num_rows($res) > 0) {
        $colony = mysqli_fetch_assoc($res);

        // Type casting for int fields
        if (isset($colony['colony_id'])) $colony['colony_id'] = (int)$colony['colony_id'];
        if (isset($colony['colony_entry_id'])) $colony['colony_entry_id'] = (int)$colony['colony_entry_id'];
        if (isset($colony['user_id'])) $colony['user_id'] = (int)$colony['user_id'];
        if (isset($colony['family_member'])) $colony['family_member'] = (int)$colony['family_member'];

        echo json_encode([
            "success" => true,
            "data" => $colony
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Colony not found"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method"
    ]);
}
?>
