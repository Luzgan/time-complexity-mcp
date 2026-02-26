def sort_list(arr):
    arr.sort()

def has_duplicates(arr):
    for i in range(len(arr)):
        if arr.count(arr[i]) > 1:
            return True
    return False

def double_all(arr):
    return list(map(lambda x: x * 2, arr))
