<?php 
require "config.php";
$employees = $conn->query("SELECT * FROM employees ORDER BY name ASC");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Tambah Penggajian</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">

<div class="container mt-4">
    <h3>Tambah Data Penggajian</h3>
    <form action="payroll_store.php" method="POST">

        <label class="mt-3">Karyawan</label>
        <select name="employee_id" class="form-control" required>
            <option value="">-- Pilih --</option>
            <?php while($e = $employees->fetch_assoc()): ?>
                <option value="<?= $e['id'] ?>"><?= $e['name'] ?></option>
            <?php endwhile; ?>
        </select>

        <label class="mt-3">Gaji Pokok</label>
        <input type="number" class="form-control" name="base_salary" required>

        <label class="mt-3">Tunjangan</label>
        <input type="number" class="form-control" name="allowance">

        <label class="mt-3">Potongan</label>
        <input type="number" class="form-control" name="deductions">

        <label class="mt-3">Tanggal Pembayaran</label>
        <input type="date" class="form-control" name="pay_date" required>

        <button class="btn btn-success mt-4">Simpan</button>
    </form>
</div>

</body>
</html>
