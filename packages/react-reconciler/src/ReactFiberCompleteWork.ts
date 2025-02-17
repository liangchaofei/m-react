import { Fiber } from "./ReactInternalTypes";
import { isNum, isStr } from "shared/utils";
import {
  HostRoot,
  HostComponent,
  HostText,
  Fragment,
  FunctionComponent,
} from "./ReactWorkTags";
export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case Fragment:
    case FunctionComponent:
    case HostRoot: {
      return null;
    }
    case HostComponent: {
      // 原生标签,type是标签名
      const { type } = workInProgress;
      if (current !== null && workInProgress.stateNode !== null) {
        console.log(
          "updateHostComponent",
          current,
          workInProgress,
          type,
          newProps
        );
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        // 1. 创建真实DOM
        const instance = document.createElement(type);
        // 2. 初始化DOM属性
        finalizeInitialChildren(instance, null, newProps);
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

function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  type: string,
  newProps: any
) {
  if (current?.memoizedProps === newProps) {
    console.log("updateHostComponent return");
    return;
  }

  finalizeInitialChildren(
    workInProgress.stateNode as Element,
    current?.memoizedProps,
    newProps
  );
}
// 初始化、更新属性

function finalizeInitialChildren(
  domElement: Element,
  prevProps: any,
  nextProps: any
) {
  for (const propKey in prevProps) {
    const prevProp = prevProps[propKey];
    if (propKey === "children") {
      if (isStr(prevProp) || isNum(prevProp)) {
        domElement.textContent = "";
      }
    } else {
      // 设置属性
      if (propKey === "onClick") {
        console.log("remove event listener", prevProp);
        domElement.removeEventListener("click", prevProp);
      } else {
        if (!(prevProp in nextProps)) {
          (domElement as any)[propKey] = "";
        }
      }
    }
  }

  for (const propKey in nextProps) {
    const nextProp = nextProps[propKey];
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        domElement.textContent = nextProp.toString();
      }
    } else {
      // 设置属性
      if (propKey === "onClick") {
        console.log("add event listener", nextProp);
        domElement.addEventListener("click", nextProp);
      } else {
        domElement.setAttribute(propKey, nextProp);
      }
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
