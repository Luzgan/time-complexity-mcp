fun bubbleSort(arr: MutableList<Int>) {
    for (i in arr.indices) {
        for (j in 0 until arr.size - 1) {
            if (arr[j] > arr[j + 1]) {
                val temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
            }
        }
    }
}

fun matrixMultiply(a: Array<IntArray>, b: Array<IntArray>): Array<IntArray> {
    val n = a.size
    val result = Array(n) { IntArray(n) }
    for (i in 0 until n) {
        for (j in 0 until n) {
            for (k in 0 until n) {
                result[i][j] += a[i][k] * b[k][j]
            }
        }
    }
    return result
}
