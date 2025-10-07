<?php 
include_once('api_connection.php');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == "POST") {
    mysqli_query($con, "SET NAMES utf8");

    // Input parameters
    $colony_id = isset($_POST['colony_id']) ? $_POST['colony_id'] : null;
    $search = isset($_POST['search']) ? trim($_POST['search']) : '';
    $page = isset($_POST['page']) && is_numeric($_POST['page']) ? (int)$_POST['page'] : 1;
    $limit = isset($_POST['limit']) && is_numeric($_POST['limit']) ? (int)$_POST['limit'] : 30;
    $offset = ($page - 1) * $limit;

    if ($colony_id !== null) {
        $colony_ids_array = array_filter(array_map('intval', explode(',', $colony_id)), function($v) { return $v > 0; });
        if (empty($colony_ids_array)) {
            echo json_encode(['error' => 'Invalid colony_id']);
            exit;
        }
        $colony_id_in = implode(',', $colony_ids_array);
    } else {
        $colony_id_in = null;
    }

    $where_clauses = ["ce.status = 'Active'"];
    if ($colony_id_in !== null) {
        $where_clauses[] = "ce.colony_id IN ($colony_id_in)";
    }
    $where_sql = implode(' AND ', $where_clauses);

    $search_sql = '';
    if ($search !== '') {
        $search_escaped = mysqli_real_escape_string($con, $search);
        $search_sql = " AND (
            ce.house_number LIKE '%$search_escaped%' OR
            primary_person_name LIKE '%$search_escaped%' OR
            primary_person_name_mr_new LIKE '%$search_escaped%' OR
            primary_person_mobile LIKE '%$search_escaped%'
        )";
    }
    
    $primaryPersonSql = "
        FROM voter_entry ve2
        WHERE ve2.colony_entry_id = ce.colony_entry_id
        AND ve2.relation = 'Primary Person'
        LIMIT 1
    ";

    $sql = "
        SELECT 
            ce.*, 
            COUNT(ve.voter_id) AS family_member,
            (
                SELECT ve2.full_name 
                $primaryPersonSql
            ) AS primary_person_name,
            (
                SELECT ve2.full_name_mr 
                $primaryPersonSql
            ) AS primary_person_name_mr,
            (
                SELECT CONCAT(
                    COALESCE(NULLIF(TRIM(ve2.first_name_mr), ''), ve2.first_name), ' ',
                    COALESCE(NULLIF(TRIM(ve2.middle_name_mr), ''), ve2.middle_name), ' ',
                    COALESCE(NULLIF(TRIM(ve2.last_name_mr), ''), ve2.last_name)
                )
                $primaryPersonSql
            ) AS primary_person_name_mr_new,
            (
                SELECT ve2.mobile 
                $primaryPersonSql
            ) AS primary_person_mobile,
            (
                SELECT ve2.photo 
                $primaryPersonSql
            ) AS primary_person_photo
        FROM 
            colony_entry ce
        LEFT JOIN 
            voter_entry ve 
            ON ce.colony_entry_id = ve.colony_entry_id
        WHERE 
            $where_sql
        GROUP BY 
            ce.colony_entry_id
        HAVING 1 $search_sql
        ORDER BY
            ce.house_number ASC
        LIMIT $limit OFFSET $offset
    ";

    $res = mysqli_query($con, $sql);
    if (!$res) {
        echo json_encode(['error' => 'Query failed: ' . mysqli_error($con)]);
        exit;
    }
    $response = mysqli_fetch_all($res, MYSQLI_ASSOC);

    $count_sql = "
        SELECT COUNT(*) AS total FROM (
            SELECT 
                ce.colony_entry_id,
                (
                    SELECT ve2.full_name 
                    $primaryPersonSql
                ) AS primary_person_name,
                (
                    SELECT ve2.full_name_mr 
                    $primaryPersonSql
                ) AS primary_person_name_mr,
                (
                    SELECT ve2.mobile 
                    $primaryPersonSql
                ) AS primary_person_mobile,
                ce.house_number
            FROM colony_entry ce
            WHERE $where_sql
            GROUP BY ce.colony_entry_id
            HAVING 1 $search_sql
        ) AS filtered_entries
    ";

    $count_res = mysqli_query($con, $count_sql);
    $total = 0;
    if ($count_res) {
        $row = mysqli_fetch_assoc($count_res);
        if ($row) $total = (int)$row['total'];
    }

    foreach ($response as &$row) {
        if (isset($row['colony_entry_id'])) $row['colony_entry_id'] = (int)$row['colony_entry_id'];
        if (isset($row['colony_id'])) $row['colony_id'] = (int)$row['colony_id'];
        if (isset($row['user_id'])) $row['user_id'] = (int)$row['user_id'];
        if (isset($row['family_member'])) $row['family_member'] = (int)$row['family_member'];
    }

    $hasMore = ($page * $limit) < $total;

    echo json_encode([
        'page' => $page,
        'limit' => $limit,
        'total_records' => $total,
        'has_more' => $hasMore,
        'data' => $response
    ]);
}
?>
