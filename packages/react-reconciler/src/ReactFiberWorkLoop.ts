import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;
export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root;
  workInProgress = fiber;

  // 开始调度更新
  ensureRootIsScheduled(root);
}

export function performConcurrentWorkOnRoot(root: FiberRoot) {
  // 开始调度工作
  // 1. render, 构建fiber树vdom
  // 2. commit, vdom -> dom
}
