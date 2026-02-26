fun linearSearch(arr: List<Int>, target: Int): Int {
    for (i in arr.indices) {
        if (arr[i] == target) return i
    }
    return -1
}

fun sumFirstTen(): Int {
    var sum = 0
    for (i in 0..9) {
        sum += i
    }
    return sum
}

fun countDown(n: Int) {
    var i = n
    while (i > 0) {
        i--
    }
}

fun add(a: Int, b: Int): Int {
    return a + b
}
