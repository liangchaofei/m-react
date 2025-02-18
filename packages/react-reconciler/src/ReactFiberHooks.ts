import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { isFn } from "shared/utils";
import { HostRoot } from "./ReactWorkTags";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
// 当前正在执行的hook
type Hook = {
  memoizedState: any;
  next: Hook | null;
};

// 当前正在执行的fiber
let currentlyRenderingFiber: Fiber | null = null;
// 当前正在执行的hook
let workInProgressHook: Hook | null = null;
// 老hook
let currentHook: Hook | null = null;

export function renderWithHooks<Props>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  props: Props
): any {
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState = null;
  let children = Component(props);
  finishRenderingHooks();
  return children;
}

function finishRenderingHooks() {
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
}
// 1. 返回当前useX函数对应的hook
// 2. 构建hook链表
function updateWorkInProgressHook(): Hook {
  let hook: Hook;
  let current = currentlyRenderingFiber.alternate;
  if (current) {
    // update阶段
    currentlyRenderingFiber!.memoizedState = current.memoizedState;

    if (workInProgressHook != null) {
      workInProgressHook = hook = workInProgressHook.next!;
      currentHook = currentHook?.next as Hook;
    } else {
      // hook单链表的头结点
      hook = workInProgressHook = currentlyRenderingFiber?.memoizedState;
      currentHook = current.memoizedState;
    }
  } else {
    // mount阶段
    currentHook = null;
    hook = {
      memoizedState: null,
      next: null,
    };
    if (workInProgressHook) {
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      // hook单链表的头结点
      workInProgressHook = currentlyRenderingFiber!.memoizedState = hook;
    }
  }

  return hook;
}

// useReducer
export function useReducer<S, I, A>(
  reducer: ((state: S, action: A) => S) | null,
  initialArg: I,
  init?: (initialArg: I) => S
) {
  // !1. 构建hook 链表
  const hook: Hook = updateWorkInProgressHook();

  let initialState: S;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg as any;
  }
  // !2.区分初始化还是更新
  if (!currentlyRenderingFiber?.alternate) {
    hook.memoizedState = initialState;
  } else {
  }
  // !3. dispatch
  const dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber!,
    hook,
    reducer as any
  );

  return [hook.memoizedState, dispatch];
}

// dispatchReducerAction
function dispatchReducerAction<S, A>(
  fiber: Fiber,
  hook: Hook,
  reducer: ((state: S, action: A) => S) | null,
  action: A
) {
  hook.memoizedState = reducer ? reducer(hook.memoizedState, action) : action;

  const root = getRootForUpdatedFiber(fiber);
  fiber.alternate = { ...fiber };
  if (fiber.sibling) {
    fiber.sibling.alternate = fiber.sibling;
  }

  scheduleUpdateOnFiber(root, fiber, true);
}
// 根据 sourceFiber 找根节点
function getRootForUpdatedFiber(sourceFiber: Fiber): FiberRoot {
  let node = sourceFiber;
  let parent = node.return;

  while (parent !== null) {
    node = parent;
    parent = node.return;
  }

  return node.tag === HostRoot ? node.stateNode : null;
}
// 源码中useState与useReducer对比
// useState,如果state没有改变，不引起组件更新。useReducer不是如此。
// reducer 代表state修改规则，useReducer比较方便服用这个规则
export function useState<S>(initialState: (() => S) | S) {
  const init = isFn(initialState) ? (initialState as any)() : initialState;
  return useReducer(null, init);
}
export function useMemo<T>(
  nextCreate: () => T,
  deps: Array<any> | void | null
): T {
  const hook = updateWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  const prevState = hook.memoizedState;
  // 检查依赖项是否发生变化
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 依赖项没有变化，返回上一次计算的结果，就是缓存的值
        return prevState[0];
      }
    }
  }

  const nextValue = nextCreate();

  hook.memoizedState = [nextValue, nextDeps];

  return nextValue;
}
// 检查hook依赖是否变化
export function areHookInputsEqual(
  nextDeps: Array<any>,
  prevDeps: Array<any> | null
): boolean {
  if (prevDeps === null) {
    return false;
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
export function useCallback<T>(callback: T, deps: Array<any> | void | null): T {
  const hook = updateWorkInProgressHook();

  const nextDeps = deps === undefined ? null : deps;

  const prevState = hook.memoizedState;
  // 检查依赖项是否发生变化
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 依赖项没有变化，返回上一次缓存的callback
        return prevState[0];
      }
    }
  }

  hook.memoizedState = [callback, nextDeps];

  return callback;
}
export function useRef<T>(initialValue: T): { current: T } {
  const hook = updateWorkInProgressHook();
  if (currentHook === null) {
    hook.memoizedState = { current: initialValue };
  }
  return hook.memoizedState;
}
