<?php
include_once('api_connection.php');
header('Content-Type: application/json');
mysqli_query($con, "SET NAMES utf8");

try {
    // Required fields
    $colony_entry_id = trim($_POST['colony_entry_id']);
    $first_name      = trim($_POST['first_name']);
    $middle_name     = trim($_POST['middle_name']);
    $last_name       = trim($_POST['last_name']);
    $full_name = trim($first_name . ' ' . $middle_name . ' ' . $last_name);
    $full_name = preg_replace('/\s+/', ' ', $full_name);
    $first_name_mr      = trim($_POST['first_name_mr']);
    $middle_name_mr     = trim($_POST['middle_name_mr']);
    $last_name_mr       = trim($_POST['last_name_mr']);
    $full_name_mr = trim($first_name_mr . ' ' . $middle_name_mr . ' ' . $last_name_mr);
    $full_name_mr = preg_replace('/\s+/', ' ', $full_name_mr);
    $voter_number    = trim($_POST['voter_number']);
    $gender          = trim($_POST['gender']);
    $availability          = trim($_POST['availability']);
    $relation          = trim($_POST['relation']);
    $dob             = trim($_POST['dob']);
    $aadhaar_number  = trim($_POST['aadhaar_number']);
    $booth_number    = trim($_POST['booth_number']);
    $mobile          = trim($_POST['mobile']);
    $user_id         = trim($_POST['user_id']);
    $type_status     = trim($_POST['type_status']);

    // Photo upload - optional now
    $photoName = '';
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/voter_photos/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $ext = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
        $photoName = basename($_FILES['photo']['name']);
        if (!move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $photoName)) {
            throw new Exception('Failed to upload photo.', 500);
        }
    }
    // Insert query
    $query = "INSERT INTO voter_entry (colony_entry_id, first_name, middle_name, last_name, full_name, first_name_mr, middle_name_mr, last_name_mr, full_name_mr, voter_number, gender, availability, relation, dob, aadhaar_number, booth_number, photo, mobile, user_id, type_status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt = $con->prepare($query);
    $stmt->bind_param(
        'isssssssssssssssssis',
        $colony_entry_id,
        $first_name,
        $middle_name,
        $last_name,
        $full_name,
        $first_name_mr,
        $middle_name_mr,
        $last_name_mr,
        $full_name_mr,
        $voter_number,
        $gender,
        $availability,
        $relation,
        $dob,
        $aadhaar_number,
        $booth_number,
        $photoName,
        $mobile,
        $user_id,
        $type_status
    );
    if ($stmt->execute()) {
        echo json_encode(['error' => false, 'message' => 'Family member submitted successfully.', 'voter_id' => $stmt->insert_id]);
    } else {
        throw new Exception('Submit failed: ' . $stmt->error, 500);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['error' => true, 'code' => $e->getCode(), 'message' => $e->getMessage()]);
}
