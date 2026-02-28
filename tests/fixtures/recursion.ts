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
