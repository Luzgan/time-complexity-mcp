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

    // O(log n) - logarithmic loop (halving pattern)
    public int logarithmicLoop(int n) {
        int count = 0;
        while (n > 1) {
            n /= 2;
            count++;
        }
        return count;
    }

    // O(n log n) - divide-and-conquer recursion (merge sort)
    public int[] mergeSort(int[] arr) {
        if (arr.length <= 1) return arr;
        int mid = arr.length / 2;
        int[] left = mergeSort(java.util.Arrays.copyOfRange(arr, 0, mid));
        int[] right = mergeSort(java.util.Arrays.copyOfRange(arr, mid, arr.length));
        return left;
    }
}
