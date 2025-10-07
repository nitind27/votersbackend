<?php
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");

try {
    // Required fields from POST
    $colony_entry_id = isset($_POST['colony_entry_id']) ? (int)trim($_POST['colony_entry_id']) : 0;
    $colony_id = isset($_POST['colony_id']) ? trim($_POST['colony_id']) : '';
    $house_number = isset($_POST['house_number']) ? trim($_POST['house_number']) : '';
    $user_id = isset($_POST['user_id']) ? (int)trim($_POST['user_id']) : 0;

    // Validation
    if ($colony_entry_id <= 0) {
        throw new Exception('Invalid or missing colony_entry_id.', 400);
    }
    if ($colony_id === '' || $house_number === '') {
        throw new Exception('All fields are required.', 400);
    }

    // Prepare update query
    $query = "UPDATE colony_entry 
              SET colony_id = ?, house_number = ?, user_id = ?, updated_at = NOW()
              WHERE colony_entry_id = ?";

    $stmt = $con->prepare($query);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $con->error, 500);
    }

    $stmt->bind_param('isii', $colony_id, $house_number, $user_id, $colony_entry_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'error' => false,
                'message' => 'Colony entry updated successfully.'
            ]);
        } else {
            echo json_encode([
                'error' => true,
                'message' => 'No changes made or colony_entry_id not found.'
            ]);
        }
    } else {
        throw new Exception('Update failed: ' . $stmt->error, 500);
    }

    $stmt->close();

} catch (Exception $e) {
    echo json_encode([
        'error' => true,
        'code' => $e->getCode(),
        'message' => $e->getMessage()
    ]);
}
