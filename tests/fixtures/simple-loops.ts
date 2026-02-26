// O(n) - single loop
function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

// O(1) - constant loop
function sumFirstTen(arr: number[]): number {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += arr[i];
  }
  return sum;
}

// O(n) - while loop
function countDown(n: number): void {
  let i = n;
  while (i > 0) {
    console.log(i);
    i--;
  }
}

// O(1) - no loops
function add(a: number, b: number): number {
  return a + b;
}
