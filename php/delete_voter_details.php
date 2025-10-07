<?php
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");

function deletePhotoFile($file) {
    $path = __DIR__ . '/voter_photos/' . $file;
    if (file_exists($path)) unlink($path);
}

try {
    $voter_id = trim($_POST['voter_id']);

    // Old photo
    $res = $con->query("SELECT photo FROM voter_entry WHERE voter_id = $voter_id");
    if ($res->num_rows == 0) throw new Exception('Voter not found.', 404);
    $photo = $res->fetch_assoc()['photo'];

    // Delete photo file
    deletePhotoFile($photo);

    // Delete record
    $stmt = $con->prepare("DELETE FROM voter_entry WHERE voter_id=?");
    $stmt->bind_param('i', $voter_id);
    if ($stmt->execute()) {
        echo json_encode(['error' => false, 'message' => 'Family member deleted successfully.']);
    } else {
        throw new Exception('Delete failed: ' . $stmt->error, 500);
    }
    $stmt->close();

} catch (Exception $e) {
    echo json_encode(['error' => true, 'code' => $e->getCode(), 'message' => $e->getMessage()]);
}
