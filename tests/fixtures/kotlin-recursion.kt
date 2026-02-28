fun factorial(n: Int): Int {
    if (n <= 1) return 1
    return n * factorial(n - 1)
}

fun fibonacci(n: Int): Int {
    if (n <= 1) return n
    return fibonacci(n - 1) + fibonacci(n - 2)
}

// O(n) - tree traversal recursion (recursive call inside loop)
class TreeNode(val value: Int, val children: List<TreeNode>)

fun traverseTree(node: TreeNode): Int {
    var sum = node.value
    for (child in node.children) {
        sum += traverseTree(child)
    }
    return sum
}

// O(log n) - logarithmic loop (halving pattern)
fun logarithmicLoop(n: Int): Int {
    var x = n
    var count = 0
    while (x > 1) {
        x /= 2
        count++
    }
    return count
}

// O(n log n) - divide-and-conquer recursion (merge sort)
fun mergeSort(arr: List<Int>): List<Int> {
    if (arr.size <= 1) return arr
    val mid = arr.size / 2
    val left = mergeSort(arr.subList(0, mid))
    val right = mergeSort(arr.subList(mid, arr.size))
    return left + right
}
