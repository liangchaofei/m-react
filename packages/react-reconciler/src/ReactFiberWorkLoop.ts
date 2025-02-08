import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;

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
  renderRootSync(root);
  // 2. commit, vdom -> dom
  // commitRoot(root); // 提交
}

function renderRootSync(root: FiberRoot) {
  const prevExecutionContext = executionContext;
  // !1. render 阶段开始
  executionContext |= RenderContext;
  // ! 2. 初始化数据
  prepareFreshStack(root);
  // ! 3. 递归构建fiber树
  workLoopSync();
  // ! 4. render 阶段结束
  executionContext = prevExecutionContext;
  workInProgressRoot = null;
}

function prepareFreshStack(root: FiberRoot) {
  root.finishedWork = null;
  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);

  if (workInProgress === null) {
    workInProgress = rootWorkInProgress; // Fiber
  }
  return workInProgress;
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork: Fiber) {
  const current = unitOfWork.alternate;
  // 1. beginWork
  let next = beginWork(current, unitOfWork);
  // 2. completeWork
  if (next === null) {
    // 没有产生新的work
    // !2. completeWork
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork: Fiber) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    let next = completeWork(current, completedWork);
    if (next !== null) {
      workInProgress = next;
      return;
    }
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    completedWork = returnFiber as Fiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}
