package fixtures

import (
	"sort"
	"strings"
)

func sortSlice(arr []int) {
	sort.Ints(arr)
}

func containsString(s string, sub string) bool {
	return strings.Contains(s, sub)
}

func appendToSlice(arr []int, val int) []int {
	return append(arr, val)
}

func hasDuplicates(arr []int) bool {
	for i := 0; i < len(arr); i++ {
		if strings.Contains("test", "t") {
			return true
		}
	}
	return false
}
