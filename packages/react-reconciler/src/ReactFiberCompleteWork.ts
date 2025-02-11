import { Fiber } from "./ReactInternalTypes";
import { isNum, isStr } from "shared/utils";
import { HostRoot, HostComponent, HostText } from "./ReactWorkTags";
export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case HostRoot: {
      return null;
    }
    case HostComponent: {
      // 原生标签,type是标签名
      const { type } = workInProgress;
      if (current !== null && workInProgress.stateNode !== null) {
        // updateHostComponent(current, workInProgress, type, newProps);
      } else {
        // 1. 创建真实DOM
        const instance = document.createElement(type);
        // 2. 初始化DOM属性
        finalizeInitialChildren(instance, workInProgress.pendingProps);
        // 3. 把子dom挂载到父dom上
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
      }
      // precacheFiberNode(workInProgress, workInProgress.stateNode as Element);
      // updateFiberProps(workInProgress.stateNode, newProps);
      return null;
    }
    case HostText: {
      workInProgress.stateNode = document.createTextNode(newProps);
      return null;
    }
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue."
  );
}
// 初始化、更新属性

function finalizeInitialChildren(domElement: Element, props: any) {
  for (const propKey in props) {
    const nextProp = props[propKey];
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        domElement.textContent = nextProp.toString();
      }
    } else {
      // 设置属性
      domElement.setAttribute(propKey, nextProp);
    }
  }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child; // 链表结构
  while (nodeFiber !== null) {
    if (isHost(nodeFiber)) {
      parent.appendChild(nodeFiber.stateNode); // nodeFiber.stateNode是DOM节点
    } else if (nodeFiber.child !== null) {
      nodeFiber = nodeFiber.child;
      continue;
    }
    if (nodeFiber === workInProgress) {
      return;
    }
    while (nodeFiber.sibling === null) {
      if (nodeFiber.return === null || nodeFiber.return === workInProgress) {
        return;
      }

      nodeFiber = nodeFiber.return;
    }

    nodeFiber = nodeFiber.sibling;
  }
}
// fiber.stateNode是DOM节点
export function isHost(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}
