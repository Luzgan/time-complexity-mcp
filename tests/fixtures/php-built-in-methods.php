<?php

function sortArray($arr) {
    sort($arr);
    return $arr;
}

function searchInArray($arr, $target) {
    return in_array($target, $arr);
}

function pushToArray($arr, $val) {
    array_push($arr, $val);
    return $arr;
}

function hasDuplicates($arr) {
    for ($i = 0; $i < count($arr); $i++) {
        if (in_array($arr[$i], array_slice($arr, $i + 1))) {
            return true;
        }
    }
    return false;
}
