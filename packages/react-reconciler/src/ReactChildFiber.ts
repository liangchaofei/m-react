import type { Fiber } from "./ReactInternalTypes";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import type { ReactElement } from "shared/ReactTypes";
import { createFiberFromElement } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";

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
  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any
  ) {
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          );
        }
      }
    }

    return null;
  }

  return reconcileChildFibers;
}
