<?php
require "config.php";

$base = $_POST['base_salary'];
$allow = $_POST['allowance'];
$ded = $_POST['deductions'];

$total = ($base + $allow) - $ded;

$stmt = $conn->prepare("
    INSERT INTO payroll (employee_id, base_salary, allowance, deductions, total, pay_date)
    VALUES (?,?,?,?,?,?)
");
$stmt->bind_param(
    "idddds",
    $_POST['employee_id'], 
    $base, 
    $allow, 
    $ded, 
    $total, 
    $_POST['pay_date']
);
$stmt->execute();

header("Location: payroll.php");
