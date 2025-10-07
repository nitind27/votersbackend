<?php
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");

function deletePhotoFile($file) {
    $path = __DIR__ . '/voter_photos/' . $file;
    if (file_exists($path)) unlink($path);
}

try {
    $voter_id    = trim($_POST['voter_id']);
    $colony_entry_id   = trim($_POST['colony_entry_id']);
    $first_name  = trim($_POST['first_name']);
    $middle_name = trim($_POST['middle_name']);
    $last_name   = trim($_POST['last_name']);
    $full_name = trim($first_name . ' ' . $middle_name . ' ' . $last_name);
    $full_name = preg_replace('/\s+/', ' ', $full_name);
    $first_name_mr      = trim($_POST['first_name_mr']);
    $middle_name_mr     = trim($_POST['middle_name_mr']);
    $last_name_mr       = trim($_POST['last_name_mr']);
    $full_name_mr = trim($first_name_mr . ' ' . $middle_name_mr . ' ' . $last_name_mr);
    $full_name_mr = preg_replace('/\s+/', ' ', $full_name_mr);
    $voter_number= trim($_POST['voter_number']);
    $gender      = trim($_POST['gender']);
    $availability      = trim($_POST['availability']);
    $relation      = trim($_POST['relation']);
    $dob         = trim($_POST['dob']);
    $aadhaar_number = trim($_POST['aadhaar_number']);
    $booth_number   = trim($_POST['booth_number']);
    $mobile      = trim($_POST['mobile']);
    $user_id     = trim($_POST['user_id']);
    $type_status = trim($_POST['type_status']);

    // Get old photo name
    $res = $con->query("SELECT photo FROM voter_entry WHERE voter_id = $voter_id");
    if ($res->num_rows != 0) $oldPhoto = $res->fetch_assoc()['photo'];

    $newPhotoName = $oldPhoto;

    // If new photo uploaded
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploadedPhotoName = basename($_FILES['photo']['name']);
        
        // If name differs → delete old one and save new
        if ($uploadedPhotoName !== $oldPhoto) {
            deletePhotoFile($oldPhoto);
            $uploadDir = __DIR__ . '/voter_photos/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            if (!move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $uploadedPhotoName)) {
                throw new Exception('Failed to upload new photo.', 500);
            }
            $newPhotoName = $uploadedPhotoName;
        }
    }

    // Update DB
    $query = "UPDATE voter_entry SET colony_entry_id=?, first_name=?, middle_name=?, last_name=?, full_name=?, first_name_mr=?, middle_name_mr=?, last_name_mr=?, full_name_mr=?, voter_number=?, gender=?, availability=?, relation=?, dob=?, aadhaar_number=?, booth_number=?, photo=?, mobile=?, user_id=?, type_status=?, updated_at=NOW() WHERE voter_id=?";
    $stmt = $con->prepare($query);
    $stmt->bind_param('isssssssssssssssssisi', $colony_entry_id, $first_name, $middle_name, $last_name, $full_name, $first_name_mr, $middle_name_mr, $last_name_mr, $full_name_mr, $voter_number, $gender, $availability, $relation, $dob, $aadhaar_number, $booth_number, $newPhotoName, $mobile, $user_id, $type_status, $voter_id);

    if ($stmt->execute()) {
        echo json_encode(['error' => false, 'message' => 'Family member updated successfully.']);
    } else {
        throw new Exception('Update failed: ' . $stmt->error, 500);
    }
    $stmt->close();

} catch (Exception $e) {
    echo json_encode(['error' => true, 'code' => $e->getCode(), 'message' => $e->getMessage()]);
}
