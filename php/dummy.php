<?php
// Fetch JSON data from the API
$jsonUrl = "https://jsonplaceholder.typicode.com/todos";
$jsonData = file_get_contents($jsonUrl);

// Decode JSON data into PHP array
$data = json_decode($jsonData, true);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Todos API Data</title>
    <style>
        table {
            border-collapse: collapse;
            width: 90%;
            margin: 20px auto;
        }
        th, td {
            border: 1px solid #444;
            padding: 8px 12px;
            text-align: left;
        }
        th {
            background-color: #bbb;
        }
        tr:nth-child(even) {
            background-color: #eee;
        }
    </style>
</head>
<body>
    <h2 style="text-align:center;">Todos List from API</h2>
    <table>
        <thead>
            <tr>
                <th>User ID</th>
                <th>ID</th>
                <th>Title</th>
                <th>Completed</th>
            </tr>
        </thead>
        <tbody>
            <?php
            if (!empty($data)) {
                foreach ($data as $todo) {
                    echo "<tr>";
                    echo "<td>" . htmlspecialchars($todo['userId']) . "</td>";
                    echo "<td>" . htmlspecialchars($todo['id']) . "</td>";
                    echo "<td>" . htmlspecialchars($todo['title']) . "</td>";
                    echo "<td>" . ($todo['completed'] ? 'Yes' : 'No') . "</td>";
                    echo "</tr>";
                }
            } else {
                echo '<tr><td colspan="4" style="text-align:center;">No data found.</td></tr>';
            }
            ?>
        </tbody>
    </table>
</body>
</html>