int factorial(int n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

int fibonacci(int n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// O(n) - tree traversal recursion (recursive call inside loop)
int traverseTree(List<dynamic> node) {
  int sum = node[0] as int;
  List<dynamic> children = node[1] as List<dynamic>;
  for (var child in children) {
    sum += traverseTree(child as List<dynamic>);
  }
  return sum;
}

// O(log n) - logarithmic loop (halving pattern)
int logarithmicLoop(int n) {
  int count = 0;
  while (n > 1) {
    n ~/= 2;
    count++;
  }
  return count;
}

// O(n log n) - divide-and-conquer recursion (merge sort)
List<int> mergeSort(List<int> arr) {
  if (arr.length <= 1) return arr;
  int mid = arr.length ~/ 2;
  List<int> left = mergeSort(arr.sublist(0, mid));
  List<int> right = mergeSort(arr.sublist(mid));
  return [...left, ...right];
}
