import type { Fiber } from "./ReactInternalTypes";
import {
  HostRoot,
  HostComponent,
  HostText,
  Fragment,
  ClassComponent,
  FunctionComponent,
} from "./ReactWorkTags";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { isNum, isStr } from "shared/utils";
import { readContext } from "./ReactFiberNewContext";
export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return updateHostText(current, workInProgress);
    case Fragment:
      return updateFragment(current, workInProgress);
    case ClassComponent:
      return updateClassComponent(current, workInProgress);
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
  }
  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue."
  );
}

// 根fiber节点
function updateHostRoot(current: Fiber | null, workInProgress: Fiber): Fiber {
  const nextChildren = workInProgress.memoizedState.element; // 获取根节点的子节点

  // 协调子节点
  reconcileChildren(current, workInProgress, nextChildren);

  if (current) {
    current.child = workInProgress.child;
  }

  return workInProgress.child;
}

// 原生标签
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber {
  const { type, pendingProps } = workInProgress;
  const isDirectTextChild = shouldSetTextContent(type, pendingProps);
  if (isDirectTextChild) {
    // 文本属性
    return null;
  }
  // 如果原生标签只有一个文本，这个时候文本不会再生成fiber节点，而是当做这个原生标签的属性
  const nextChildren = pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// 文本节点
function updateHostText(current: Fiber | null, workInProgress: Fiber): Fiber {
  return null;
}
// fragment
function updateFragment(current: Fiber | null, workInProgress: Fiber): Fiber {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}
// 类组件
// 更新自己
// 协调子节点
function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  const context = type.contextType;
  const newValue = readContext(context);
  let instance = workInProgress.stateNode;
  if (current === null) {
    instance = new type(pendingProps);
    workInProgress.stateNode = instance;
  }
  instance.context = newValue;
  const children = instance.render();
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}
// 函数组件
function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  const children = type(pendingProps);
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}

// 协调子节点
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any
) {
  // 初次挂载
  if (current === null) {
    console.log("workInProgress fff", workInProgress);
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    console.log("workInProgress  aaa", workInProgress);
    // 更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}
function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    isStr(props.children) ||
    isNum(props.children) ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}
