<?php 
session_start();
if (!isset($_SESSION['user'])) { header("Location: login.php"); exit; }

require "config.php";
$payroll = $conn->query("
    SELECT payroll.*, employees.name 
    FROM payroll 
    JOIN employees ON payroll.employee_id = employees.id 
    ORDER BY payroll.pay_date DESC
");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Payroll</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">

<?php include "navbar.php"; ?>

<div class="container mt-4">
    <h3 class="mb-3">📄 Data Penggajian Karyawan</h3>
    <a href="payroll_create.php" class="btn btn-primary mb-3">+ Tambah Penggajian</a>

    <table class="table table-bordered table-striped">
        <thead class="table-dark">
            <tr>
                <th>Karyawan</th>
                <th>Gaji Pokok</th>
                <th>Tunjangan</th>
                <th>Potongan</th>
                <th>Total</th>
                <th>Tanggal Bayar</th>
                <th>Aksi</th>
            </tr>
        </thead>
        <tbody>
            <?php while($row = $payroll->fetch_assoc()): ?>
            <tr>
                <td><?= $row['name'] ?></td>
                <td>Rp <?= number_format($row['base_salary'],0,",",".") ?></td>
                <td>Rp <?= number_format($row['allowance'],0,",",".") ?></td>
                <td>Rp <?= number_format($row['deductions'],0,",",".") ?></td>
                <td><b>Rp <?= number_format($row['total'],0,",",".") ?></b></td>
                <td><?= $row['pay_date'] ?></td>
                <td>
                    <a href="payroll_edit.php?id=<?= $row['id'] ?>" class="btn btn-sm btn-warning">Edit</a>
                    <a onclick="return confirm('Hapus data?')" 
                       href="payroll_delete.php?id=<?= $row['id'] ?>" 
                       class="btn btn-sm btn-danger">Hapus</a>
                </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
    </table>
</div>
</body>
</html>
