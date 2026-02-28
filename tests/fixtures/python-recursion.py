def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# O(n) - tree traversal recursion (recursive call inside loop)
def traverse_tree(node):
    total = node["value"]
    for child in node["children"]:
        total += traverse_tree(child)
    return total

# O(log n) - logarithmic loop (halving pattern)
def log_loop(n):
    count = 0
    while n > 1:
        n //= 2
        count += 1
    return count

# O(n log n) - divide-and-conquer recursion (merge sort)
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return left + right
