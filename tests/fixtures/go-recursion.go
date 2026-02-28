package fixtures

func factorial(n int) int {
	if n <= 1 {
		return 1
	}
	return n * factorial(n-1)
}

func fibonacci(n int) int {
	if n <= 1 {
		return n
	}
	return fibonacci(n-1) + fibonacci(n-2)
}

// O(n) - tree traversal recursion (recursive call inside loop)
type Node struct {
	Value    int
	Children []*Node
}

func traverseTree(node *Node) int {
	sum := node.Value
	for _, child := range node.Children {
		sum += traverseTree(child)
	}
	return sum
}
