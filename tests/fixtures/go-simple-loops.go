package fixtures

func linearSearch(arr []int, target int) int {
	for i := 0; i < len(arr); i++ {
		if arr[i] == target {
			return i
		}
	}
	return -1
}

func rangeLoop(arr []int) int {
	sum := 0
	for _, v := range arr {
		sum += v
	}
	return sum
}

func whileStyleLoop(n int) int {
	i := 0
	for i < n {
		i++
	}
	return i
}

func constantLoop() int {
	sum := 0
	for i := 0; i < 10; i++ {
		sum += i
	}
	return sum
}
