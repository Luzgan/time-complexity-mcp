int linearSearch(List<int> arr, int target) {
  for (int i = 0; i < arr.length; i++) {
    if (arr[i] == target) return i;
  }
  return -1;
}

int sumFirstTen() {
  int sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += i;
  }
  return sum;
}

int countDown(int n) {
  while (n > 0) {
    n--;
  }
  return n;
}

int add(int a, int b) {
  return a + b;
}
