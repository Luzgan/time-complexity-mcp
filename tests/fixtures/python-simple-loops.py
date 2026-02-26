def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1

def sum_first_ten():
    total = 0
    for i in range(10):
        total += i
    return total

def count_down(n):
    while n > 0:
        n -= 1

def add(a, b):
    return a + b
