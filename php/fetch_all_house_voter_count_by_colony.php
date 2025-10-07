<?php
include_once('api_connection.php');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST" && isset($_POST['colony_id'])) {
    // Set UTF-8 encoding
    mysqli_query($con, "SET NAMES utf8");

    // Get colony_ids from POST parameter, sanitize and prepare for query
    $colony_ids = $_POST['colony_id']; // e.g. "1,2,3"
    $ids_array = array_filter(array_map('intval', explode(',', $colony_ids)), fn($id) => $id > 0);

    if (empty($ids_array)) {
        echo json_encode(['error' => 'No valid colony IDs provided']);
        exit;
    }

    $ids_string = implode(',', $ids_array);

    // SQL query to get colony_name, total voters, and house count by colony_id
    $sql = "
        SELECT 
            c.colony_id,
            c.colony_name,
            COUNT(DISTINCT ce.house_number) AS total_house_count,
            COUNT(ve.voter_id) AS total_voter_count
        FROM colony c
        LEFT JOIN colony_entry ce ON c.colony_id = ce.colony_id AND ce.status = 'Active'
        LEFT JOIN voter_entry ve ON ce.colony_entry_id = ve.colony_entry_id AND ve.status = 'Active'
        WHERE c.colony_id IN ($ids_string) AND c.status = 'Active'
        GROUP BY c.colony_id, c.colony_name
        ORDER BY c.colony_id DESC
    ";

    $result = mysqli_query($con, $sql);

    if (!$result) {
        echo json_encode(['error' => 'Database query error']);
        exit;
    }

    $response = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $row['colony_id'] = (int)$row['colony_id'];
        // $row['total_house_count'] = (int)$row['total_house_count'];
        // $row['total_voter_count'] = (int)$row['total_voter_count'];
        $response[] = $row;
    }

    echo json_encode($response);
} else {
    echo json_encode(['error' => 'Invalid request, colony_ids parameter missing']);
}
?>
