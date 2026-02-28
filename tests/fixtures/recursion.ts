// O(n) - linear recursion
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

// O(2^n) - branching recursion
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// O(n) - tree traversal recursion (recursive call inside loop)
interface TreeNode {
  value: number;
  children: TreeNode[];
}

function traverseTree(node: TreeNode): number {
  let sum = node.value;
  for (const child of node.children) {
    sum += traverseTree(child);
  }
  return sum;
}

// O(log n) - logarithmic loop (halving pattern)
function logarithmicLoop(n: number): number {
  let count = 0;
  while (n > 1) {
    n /= 2;
    count++;
  }
  return count;
}

// O(n log n) - divide-and-conquer recursion (merge sort)
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return left.concat(right);
}
