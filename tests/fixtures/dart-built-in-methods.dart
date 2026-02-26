void sortList(List<int> arr) {
  arr.sort();
}

bool hasDuplicates(List<int> arr) {
  for (int i = 0; i < arr.length; i++) {
    if (arr.contains(arr[i])) return true;
  }
  return false;
}

List<int> doubleAll(List<int> items) {
  return items.map((x) => x * 2).toList();
}
