import {
  IndeterminateComponent,
  WorkTag,
  HostComponent,
} from "./ReactWorkTags";
import type { Fiber } from "./ReactInternalTypes";
import { NoFlags } from "./ReactFiberFlags";
import type { ReactElement } from "shared/ReactTypes";
import { isFn, isStr } from "shared/utils";
// 创建一个fiber
export function createFiber(
  tag: WorkTag,
  pendingProps: any,
  key: null | string
): Fiber {
  return new FiberNode(tag, pendingProps, key);
}

function FiberNode(tag: WorkTag, pendingProps: any, key: null | string) {
  // 标记fiber的类型，即描述的组件类型，如原生标签、函数组件、类组件、Fragment等。这里参考ReactWorkTags.js
  this.tag = tag;
  // 定义组件在当前层级下的唯一性
  // 标记组件在当前层级下的的唯一性

  this.key = key;
  // 组件类型
  this.elementType = null;
  // 组件类型
  this.type = null;
  // 不同的组件的  stateNode 定义也不同
  // 原生标签：string
  // 类组件：实例
  this.stateNode = null;

  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  // 记录了节点在兄弟节点中的位置下标，用于diff时候判断节点是否需要发生移动
  this.index = 0;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;

  // 不同的组件的 memoizedState 指代也不同
  // 函数组件 hook0
  // 类组件 state
  this.memoizedState = null;

  // Effects
  this.flags = NoFlags;

  // 缓存fiber
  this.alternate = null;
}

// 根据 ReactElement 创建Fiber
export function createFiberFromElement(element: ReactElement) {
  const { type, key } = element;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(type, key, pendingProps);
  return fiber;
}

// 根据 TypeAndProps 创建fiber
export function createFiberFromTypeAndProps(
  type: any,
  key: null | string,
  pendingProps: any
) {
  let fiberTag: WorkTag = IndeterminateComponent;

  if (isStr(type)) {
    // 原生标签
    fiberTag = HostComponent;
  }

  const fiber = createFiber(fiberTag, pendingProps, key);
  fiber.elementType = type;
  fiber.type = type;
  return fiber;
}
