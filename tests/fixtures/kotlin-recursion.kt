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
