public class SimpleLoops {
    public int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) return i;
        }
        return -1;
    }

    public int sumFirstTen() {
        int sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += i;
        }
        return sum;
    }

    public void countDown(int n) {
        while (n > 0) {
            n--;
        }
    }

    public int add(int a, int b) {
        return a + b;
    }
}
