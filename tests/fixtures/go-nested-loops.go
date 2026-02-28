package fixtures

func bubbleSort(arr []int) []int {
	n := len(arr)
	for i := 0; i < n; i++ {
		for j := 0; j < n-i-1; j++ {
			if arr[j] > arr[j+1] {
				arr[j], arr[j+1] = arr[j+1], arr[j]
			}
		}
	}
	return arr
}

func tripleNested(matrix [][]int) int {
	sum := 0
	n := len(matrix)
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			for k := 0; k < n; k++ {
				sum += matrix[i][j] * matrix[j][k]
			}
		}
	}
	return sum
}
