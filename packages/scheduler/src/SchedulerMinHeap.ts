export type Heap<T extends Node> = Array<T>;
export type Node = {
  id: number; // 任务id
  sortIndex: number; // 排序依据
};

// 获取堆顶元素
export function peek<T extends Node>(heap: Heap<T>): T | null {
  return heap.length > 0 ? heap[0] : null;
}

// push
export function push<T extends Node>(heap: Heap<T>, node: T) {
  // 把node放到末尾
  const index = heap.length;
  heap.push(node);
  // 向上调整
  siftUp(heap, node, index);
}
// siftUp
export function siftUp<T extends Node>(heap: Heap<T>, node: T, i: number) {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      // parent > node
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}

// pop

export function pop() {}

// compare
export function compare(a: Node, b: Node) {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}