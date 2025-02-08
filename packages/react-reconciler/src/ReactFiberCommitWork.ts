import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ChildDeletion, Placement, Update } from "./ReactFiberFlags";
import { FunctionComponent, HostComponent, HostRoot } from "./ReactWorkTags";
import { isHost } from "./ReactFiberCompleteWork";
export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
  // 1. 遍历
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
}
function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child = parentFiber.child;
  // 遍历单链表
  while (child !== null) {
    commitMutationEffects(root, child);
    child = child.sibling;
  }
}

function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;
  if (flags && Placement) {
    commitPlacement(finishedWork);

    finishedWork.flags &= ~Placement;
  }
}

function commitPlacement(finishedWork: Fiber) {
  if (finishedWork.stateNode && isHost(finishedWork)) {
    // finishedWork是有dom节点
    // 找domNode的父DOM节点对应的fiber
    const parentFiber = getHostParentFiber(finishedWork);

    let parentDom = parentFiber.stateNode;

    if (parentDom.containerInfo) {
      // HostRoot
      parentDom = parentDom.containerInfo;
    }

    // 遍历fiber，寻找finishedWork的兄弟节点，并且这个sibling有dom节点，且是更新的节点。在本轮不发生移动
    const before = getHostSibling(finishedWork);
    insertOrAppendPlacementNode(finishedWork, before, parentDom);
  }
}
function getHostSibling(fiber: Fiber) {
  let node = fiber;
  sibling: while (1) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    // todo
    node = node.sibling;
    while (!isHost(node)) {
      // 新增插入|移动位置
      if (node.flags & Placement) {
        continue sibling;
      }
      if (node.child === null) {
        continue sibling;
      } else {
        node = node.child;
      }
    }

    // HostComponent|HostText
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
}
function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
  throw new Error(
    "Expected to find a host parent. This error is likely caused by a bug " +
      "in React. Please file an issue."
  );
}
// 检查fiber是HostParent
function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}
function getStateNode(fiber: Fiber) {
  let node = fiber;
  while (1) {
    if (isHost(node) && node.stateNode) {
      return node.stateNode;
    }
    node = node.child as Fiber;
  }
}

// 新增插入 | 位置移动
// insertBefore | appendChild
function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element,
  parent: Element
) {
  if (before) {
    parent.insertBefore(getStateNode(node), before);
  } else {
    parent.appendChild(getStateNode(node));
  }
}

export function flushPassiveEffects(root: Fiber) {}
