import java.util.Collections;
import java.util.List;

public class BuiltInMethods {
    public void sortList(List<Integer> list) {
        Collections.sort(list);
    }

    public boolean hasDuplicates(List<Integer> list) {
        for (int i = 0; i < list.size(); i++) {
            if (list.contains(list.get(i))) return true;
        }
        return false;
    }

    public void processAll(List<Integer> list) {
        list.forEach(x -> System.out.println(x));
    }
}
