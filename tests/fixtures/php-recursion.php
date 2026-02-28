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
