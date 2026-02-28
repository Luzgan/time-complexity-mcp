<?php

function factorial($n) {
    if ($n <= 1) return 1;
    return $n * factorial($n - 1);
}

function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n - 1) + fibonacci($n - 2);
}

// O(n) - tree traversal recursion (recursive call inside loop)
function traverseTree($node) {
    $sum = $node['value'];
    foreach ($node['children'] as $child) {
        $sum += traverseTree($child);
    }
    return $sum;
}

// O(log n) - logarithmic loop (halving pattern)
function logarithmicLoop($n) {
    $count = 0;
    while ($n > 1) {
        $n /= 2;
        $count++;
    }
    return $count;
}

// O(n log n) - divide-and-conquer recursion (merge sort)
function mergeSort($arr) {
    if (count($arr) <= 1) return $arr;
    $mid = intdiv(count($arr), 2);
    $left = mergeSort(array_slice($arr, 0, $mid));
    $right = mergeSort(array_slice($arr, $mid));
    return array_merge($left, $right);
}
