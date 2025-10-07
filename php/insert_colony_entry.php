<?php
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");

try {
    // Required fields from POST
    $colony_id     = trim($_POST['colony_id']);
    $house_number  = trim($_POST['house_number']);
    $user_id     = trim($_POST['user_id']);

    // Validation
    if ($colony_id === '' || $house_number === '') {
        throw new Exception('All fields are required.', 400);
    }

    // Insert query - photo not required
    $query = "INSERT INTO colony_entry (colony_id, house_number, user_id, created_at, updated_at)
              VALUES (?, ?, ?, NOW(), NOW())";

    $stmt = $con->prepare($query);
    $stmt->bind_param('isi', $colony_id, $house_number,$user_id);

    if ($stmt->execute()) {
        echo json_encode([
            'error' => false,
            'message' => 'Family members submitted successfully.',
            'colony_entry_id' => $stmt->insert_id
        ]);
    } else {
        throw new Exception('Submit failed: ' . $stmt->error, 500);
    }

    $stmt->close();

} catch (Exception $e) {
    echo json_encode([
        'error' => true,
        'code' => $e->getCode(),
        'message' => $e->getMessage()
    ]);
}
?>
