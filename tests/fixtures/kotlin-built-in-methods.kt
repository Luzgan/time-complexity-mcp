fun sortList(list: MutableList<Int>) {
    list.sort()
}

fun hasDuplicates(list: List<Int>): Boolean {
    for (i in list.indices) {
        if (list.indexOf(list[i]) != i) return true
    }
    return false
}

fun doubleAll(list: List<Int>): List<Int> {
    return list.map { it * 2 }
}
