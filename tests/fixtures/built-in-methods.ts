// O(n log n) - sort
function sortArray(arr: number[]): number[] {
  return arr.sort((a, b) => a - b);
}

// O(n) - includes inside loop => O(n^2)
function hasDuplicates(arr: number[]): boolean {
  for (let i = 0; i < arr.length; i++) {
    if (arr.includes(arr[i])) return true;
  }
  return false;
}

// O(n) - map
function doubleAll(arr: number[]): number[] {
  return arr.map(x => x * 2);
}
