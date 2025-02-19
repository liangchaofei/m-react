import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import {
  commitMutationEffects,
  flushPassiveEffects,
} from "./ReactFiberCommitWork";
import { Scheduler } from "scheduler";
import { NormalPriority } from "scheduler/src/SchedulerPriorities";
import { completeWork } from "./ReactFiberCompleteWork";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null = null;

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  isSync?: boolean
) {
  workInProgressRoot = root;
  workInProgress = fiber;

  // 开始调度更新
  if (isSync) {
    queueMicrotask(() => performConcurrentWorkOnRoot(root));
  } else {
    ensureRootIsScheduled(root);
  }
}

export function performConcurrentWorkOnRoot(root: FiberRoot) {
  // 开始调度工作
  // 1. render, 构建fiber树vdom
  renderRootSync(root);
  console.log("root", root);
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork; // 根Fiber
  // 2. commit, vdom -> dom
  commitRoot(root); // 提交
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

function commitRoot(root: FiberRoot) {
  // !1. commit 阶段开始
  const prevExecutionContext = executionContext;
  executionContext |= CommitContext;

  // !2.1 mutation阶段, 渲染DOM树
  commitMutationEffects(root, root.finishedWork as Fiber); //Fiber,HostRoot=3
  // !2.2 passive effect阶段，执行 passive effect
  Scheduler.scheduleCallback(NormalPriority, () => {
    flushPassiveEffects(root.finishedWork as Fiber);
  });

  // !3. commit结束
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
  // 把pendingProps更新到memoizedProps
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
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
