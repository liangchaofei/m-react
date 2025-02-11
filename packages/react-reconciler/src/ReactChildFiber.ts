import type { Fiber } from "./ReactInternalTypes";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import type { ReactElement } from "shared/ReactTypes";
import { createFiberFromElement, createFiberFromText } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";
import { isArray } from "shared/utils";

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any
) => Fiber | null;
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

export const reconcileChildFibers: ChildReconciler =
  createChildReconciler(true);
// 协调子节点
function createChildReconciler(shouldTrackSideEffects: boolean) {
  // 给fiber节点添加flags
  function placeSingleChild(newFiber: Fiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }
  // 协调单个节点，对于页面初次渲染，创建fiber，不涉及对比复用老节点
  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement
  ) {
    let createdFiber = createFiberFromElement(element);
    createdFiber.return = returnFiber;
    return createdFiber;
  }

  function createChild(returnFiber: Fiber, newChild: any): Fiber | null {
    if (isText(newChild)) {
      const created = createFiberFromText(newChild + "");
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
      }
    }

    return null;
  }

  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<any>
  ) {
    let resultFirstChild: Fiber | null = null; // 头结点
    let previousNewFiber: Fiber | null = null;
    let oldFiber = currentFirstChild;
    let newIdx = 0;

    // 初次渲染，创建fiber
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (newFiber === null) {
          continue;
        }
        newFiber.index = newIdx; // 组件更新阶段，判断在更新前后的位置师傅一样，如果不一样，需要移动

        if (previousNewFiber === null) {
          // 第一个节点，不要用newIdx判断，因为有可能有null，而null不是有效fiber
          resultFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }

      return resultFirstChild;
    }

    return resultFirstChild;
  }

  // 文本
  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null, // todo 更新
    textContent: string
  ) {
    const created = createFiberFromText(textContent);
    created.return = returnFiber;
    return created;
  }
  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any
  ) {
    if (isText(newChild)) {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + "")
      );
    }
    // 检查newChild类型，单个节点，文本，数组
    console.log("newChild", newChild);
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          );
        }
      }
    }

    // 子节点是数组
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }

    return null;
  }

  return reconcileChildFibers;
}

function isText(newChild: any) {
  return (
    (typeof newChild === "string" && newChild !== "") ||
    typeof newChild === "number"
  );
}
