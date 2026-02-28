<?php

function linearSearch($arr, $target) {
    for ($i = 0; $i < count($arr); $i++) {
        if ($arr[$i] === $target) return $i;
    }
    return -1;
}

function foreachLoop($arr) {
    $sum = 0;
    foreach ($arr as $val) {
        $sum += $val;
    }
    return $sum;
}

function whileLoop($n) {
    $i = 0;
    while ($i < $n) {
        $i++;
    }
    return $i;
}

function constantLoop() {
    $sum = 0;
    for ($i = 0; $i < 10; $i++) {
        $sum += $i;
    }
    return $sum;
}
