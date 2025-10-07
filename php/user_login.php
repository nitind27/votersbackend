<?php 
include_once('api_connection.php');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    mysqli_query($con, "SET NAMES utf8");
    $response = array();

    try {
        $username = isset($_POST['username']) ? trim($_POST['username']) : '';
        $password = isset($_POST['password']) ? trim($_POST['password']) : '';
        $device_uid = isset($_POST['device_uid']) ? trim($_POST['device_uid']) : '';

        if (empty($username) || empty($password)) {
            throw new Exception('All fields are required.', 500);
        }

        $username_esc = mysqli_real_escape_string($con, $username);
        $password_esc = mysqli_real_escape_string($con, $password);
        $device_uid_esc = mysqli_real_escape_string($con, $device_uid);

        // Step 1: Check username exists and active
        $sql_user = "SELECT * FROM users WHERE username = '$username_esc' AND status = 'Active' LIMIT 1";
        $res_user = mysqli_query($con, $sql_user);
        if (!$res_user) {
            throw new Exception('Database query failed: ' . mysqli_error($con), 500);
        }
        if (mysqli_num_rows($res_user) == 0) {
            throw new Exception('Username is wrong', 101);
        }
        $user_row = mysqli_fetch_assoc($res_user);

        // Step 2: Check password correctness
        $sql_pass = "SELECT * FROM users WHERE username = '$username_esc' AND password = '$password_esc' AND status = 'Active' LIMIT 1";
        $res_pass = mysqli_query($con, $sql_pass);
        if (!$res_pass) {
            throw new Exception('Database query failed: ' . mysqli_error($con), 500);
        }
        if (mysqli_num_rows($res_pass) == 0) {
            throw new Exception('Password is wrong', 102);
        }
        $user_pass_row = mysqli_fetch_assoc($res_pass);

        // Step 3: Update device_uid in DB if POST device_uid is not blank but user device_uid is blank
        if (!empty($device_uid_esc) && empty($user_pass_row['device_uid'])) {
            $update_sql = "UPDATE users SET device_uid = '$device_uid_esc' WHERE user_id = " . (int)$user_pass_row['user_id'];
            $update_res = mysqli_query($con, $update_sql);
            if (!$update_res) {
                throw new Exception('Failed to update device UID: ' . mysqli_error($con), 500);
            }
            // Update local variable after DB update
            $user_pass_row['device_uid'] = $device_uid_esc;
        }

        // Step 4: Device UID check (only if both POST and DB device_uid are non-empty)
        if (!empty($device_uid_esc) && !empty($user_pass_row['device_uid'])) {
            if ($device_uid_esc !== $user_pass_row['device_uid']) {
                throw new Exception("You can't login another device", 103);
            }
        }

        // Return full user data with category name
        $sql_full = "
            SELECT u.*, c.name AS category_name
            FROM users u
            LEFT JOIN category c 
                ON u.category_id = c.category_id 
                AND c.status = 'Active'
            WHERE u.username = '$username_esc'
              AND u.password = '$password_esc'
              AND u.status = 'Active'
            LIMIT 1
        ";
        $res_full = mysqli_query($con, $sql_full);
        if (!$res_full) {
            throw new Exception('Database query failed: ' . mysqli_error($con), 500);
        }
        $user = mysqli_fetch_object($res_full);
        if ($user !== null) {
            if (isset($user->user_id)) $user->user_id = (int)$user->user_id;
            if (isset($user->category_id)) $user->category_id = (int)$user->category_id;

            $response = array(
                'error' => false,
                'code' => 200,
                'message' => 'Login Successfully',
                'data' => $user
            );
        } else {
            throw new Exception('Invalid login details', 104);
        }

    } catch (Exception $e) {
        $response = array(
            'error' => true,
            'code' => $e->getCode(),
            'message' => $e->getMessage()
        );
    }

    echo json_encode($response);
} else {
    echo json_encode(array(
        'error' => true,
        'code' => 405,
        'message' => 'Invalid method',
    ));
}
?>
