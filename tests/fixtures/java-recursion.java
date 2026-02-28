public class Recursion {
    public int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    // O(n) - tree traversal recursion (recursive call inside loop)
    public int traverseTree(int[][] node) {
        int sum = node[0][0];
        for (int i = 1; i < node.length; i++) {
            sum += traverseTree(new int[][] { node[i] });
        }
        return sum;
    }
}
