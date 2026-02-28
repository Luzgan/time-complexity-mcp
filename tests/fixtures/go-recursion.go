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

// O(log n) - logarithmic loop (halving pattern)
func logarithmicLoop(n int) int {
	count := 0
	for n > 1 {
		n /= 2
		count++
	}
	return count
}

// O(n log n) - divide-and-conquer recursion (merge sort)
func mergeSort(arr []int) []int {
	if len(arr) <= 1 {
		return arr
	}
	mid := len(arr) / 2
	left := mergeSort(arr[:mid])
	right := mergeSort(arr[mid:])
	return append(left, right...)
}
