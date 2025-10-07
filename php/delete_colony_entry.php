<?php
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");

function deletePhotoFile($file) {
    $path = __DIR__ . '/voter_photos/' . $file;
    if ($file && file_exists($path)) {
        unlink($path);
    }
}

try {
    // Validate and sanitize colony_entry_id
    $colony_entry_id = isset($_POST['colony_entry_id']) && is_numeric($_POST['colony_entry_id']) ? (int)$_POST['colony_entry_id'] : 0;
    if ($colony_entry_id <= 0) {
        throw new Exception('Invalid or missing colony_entry_id.', 400);
    }

    // Begin transaction
    $con->begin_transaction();

    // 1. Fetch all voter photos for this colony_entry_id to delete files later
    $votersRes = $con->query("SELECT photo FROM voter_entry WHERE colony_entry_id = $colony_entry_id");
    if ($votersRes === false) {
        throw new Exception('Failed to fetch voter entries.', 500);
    }

    // 2. Delete voter entries related to the colony_entry_id
    $stmtVoters = $con->prepare("DELETE FROM voter_entry WHERE colony_entry_id = ?");
    if (!$stmtVoters) {
        throw new Exception('Prepare failed for voter deletion: ' . $con->error, 500);
    }
    $stmtVoters->bind_param('i', $colony_entry_id);
    if (!$stmtVoters->execute()) {
        throw new Exception('Voter deletion failed: ' . $stmtVoters->error, 500);
    }
    $stmtVoters->close();

    // 3. Delete colony entry itself
    $stmtColony = $con->prepare("DELETE FROM colony_entry WHERE colony_entry_id = ?");
    if (!$stmtColony) {
        throw new Exception('Prepare failed for colony deletion: ' . $con->error, 500);
    }
    $stmtColony->bind_param('i', $colony_entry_id);
    if (!$stmtColony->execute()) {
        throw new Exception('Colony deletion failed: ' . $stmtColony->error, 500);
    }
    $stmtColony->close();

    // 4. Commit transaction
    $con->commit();

    // 5. Delete photo files outside database transaction
    while ($voter = $votersRes->fetch_assoc()) {
        if (!empty($voter['photo'])) {
            deletePhotoFile($voter['photo']);
        }
    }

    echo json_encode([
        'error' => false,
        'message' => 'Family members deleted successfully.'
    ]);
} catch (Exception $e) {
    // Rollback transaction if active
    if ($con->in_transaction) {
        $con->rollback();
    }
    echo json_encode([
        'error' => true,
        'code' => $e->getCode(),
        'message' => $e->getMessage()
    ]);
}
