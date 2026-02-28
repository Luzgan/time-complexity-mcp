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
