// 实现单线程任务调度器
import {
  NormalPriority,
  IdlePriority,
  ImmediatePriority,
  UserBlockingPriority,
  LowPriority,
  NoPriority,
  PriorityLevel,
} from "./SchedulerPriorities";
import { getCurrentTime, isFn } from "shared/utils";
import { peek, pop, push } from "./SchedulerMinHeap";
import {
  userBlockingPriorityTimeout,
  normalPriorityTimeout,
  maxSigned31BitInt,
  lowPriorityTimeout,
} from "./SchedulerFeatureFlags";

type Callback = (arg: boolean) => Callback | null | undefined;

export type Task = {
  id: number; // 任务id
  callback: Callback | null; // 任务回调
  priorityLevel: PriorityLevel; // 任务优先级
  startTime: number; // 任务开始时间
  sortIndex: number; // 任务排序依据
  expirationTime: number; // 任务过期时间
};

// 任务池，最小堆结构，没有延迟的任务
const taskQueue: Array<Task> = [];
// 有延迟的任务
const timerQueue: Array<Task> = [];

// 任务id
let taskIdCounter: number = 1;
// 当前任务
let currentTask: Task | null = null;
// 当前任务优先级
let currentPriorityLevel: PriorityLevel = NormalPriority;
// 主线程是否在执行任务
let isHostCallbackScheduled: boolean = false;
// 是否在任务调度
let isMessageLoopRunning: boolean = false;

// 是否有任务在倒计时
let isHostTimeoutScheduled: boolean = false;

let taskTimeoutId: number = -1;

// 任务调度器入口
function scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: {
    delay: number;
  }
) {
  let startTime;
  const currentTime = getCurrentTime();
  if (typeof options === "object" && options !== null) {
    const delay = options.delay;
    if (typeof delay === "number" && delay > 0) {
      // 有延迟的任务
      startTime = currentTime + delay;
    } else {
      // 没有延迟的任务
      startTime = currentTime;
    }
  } else {
    // 没有延迟的任务
    startTime = currentTime;
  }

  let timeout: number;

  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = -1;
      break;
    case UserBlockingPriority:
      timeout = userBlockingPriorityTimeout;
      break;
    case IdlePriority:
      timeout = maxSigned31BitInt;
      break;
    case LowPriority:
      timeout = lowPriorityTimeout;
      break;
    case NormalPriority:
    default:
      timeout = normalPriorityTimeout;
      break;
  }

  // 任务过期时间, 开始时间 + 执行时间（根据优先级不同）
  const expirationTime = startTime + timeout;
  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    sortIndex: -1,
    expirationTime,
  };

  if (startTime > currentTime) {
    // 有延迟的任务
    newTask.sortIndex = startTime; // 以开始时间排序
    push(timerQueue, newTask); // 把任务放到任务池中 timerQueue，到时候再把任务放到任务池中taskQueue中

    // 每次只倒计时一个任务
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        // newTask 才是堆顶任务，优先执行
        cancelHostTimeout();
      } else {
        // 倒计时
        isHostTimeoutScheduled = true;
      }
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    newTask.sortIndex = expirationTime; // 任务排序依据, 时间越短，优先级越高
    // 把任务放到任务池中
    push(taskQueue, newTask);
    if (!isHostCallbackScheduled) {
      isHostCallbackScheduled = true;
      // 执行任务
      requestHostCallback();
    }
  }
}

// 执行任务
function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    // 执行任务
    schedulePerformWorkUntilDeadline();
  }
}

function performWorkUntilDeadline() {
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime();
    // 记录一个work的起始时间
    startTime = currentTime;
    let hasMoreWork = true;
    try {
      hasMoreWork = fulshWork(currentTime);
    } finally {
      // 任务执行完了，控制权交给主线程
      if (!hasMoreWork) {
        isMessageLoopRunning = false;
        isHostCallbackScheduled = false;
      } else {
        // 任务没有执行完，控制权交给浏览器
        schedulePerformWorkUntilDeadline();
      }
    }
  }
}

function fulshWork(currentTime: number) {
  isHostCallbackScheduled = false;
  isPerformingWork = true;

  let previousPriorityLevel = currentPriorityLevel;
  try {
    return wookLoop(currentTime);
  } finally {
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
    currentTask = null;
  }
}

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);
}

// 去掉某个任务
function cancelCallback() {
  if (currentTask !== null) {
    currentTask.callback = null;
  }
}

// 获取当前任务的优先级
function getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel;
}

// 记录时间切片的开始时间，时间戳
let startTime: number = -1;

// 时间切片，时间段
let frameInterval: number = 5;

// 是否有work在执行
let isPerformingWork: boolean = false;

// 什么时候控制权交给主线程
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    return false;
  }
  return true;
}
// 有很多task,每个task都有一个callback,cb执行完了，就执行下一个task
// 一个work就是一个时间切片内执行的一些task
// 时间切片要循环，就是work要循环
function wookLoop(initialTime: number): boolean {
  let currentTime = initialTime;
  advanceTimers(currentTime);
  currentTask = peek(taskQueue);

  while (currentTask !== null) {
    // 时间过期了，交给主线程
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    // 执行任务
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel; // 当前任务优先级
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime; // 任务是否过期
      const continuationCallback = callback(didUserCallbackTimeout); // 执行任务，没有执行完
      currentTime = getCurrentTime();
      if (typeof continuationCallback === "function") {
        // 任务执行完了，但是还有任务，继续执行
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        return true;
      } else {
        // 如果是堆顶任务，则可以直接删除
        if (currentTask === peek(taskQueue)) {
          // 任务执行完了，从任务池中删除
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      // 任务执行完了，从任务池中删除
      pop(taskQueue);
    }
    currentTask = peek(taskQueue); // 获取下个任务
  }

  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}

function requestHostTimeout(
  callback: (currentTime: number) => void,
  ms: number
) {
  taskTimeoutId = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}
// delay任务处理逻辑
function cancelHostTimeout() {
  clearTimeout(taskTimeoutId);
  taskTimeoutId = -1;
}

function advanceTimers(currentTime: number) {
  let timer = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      // 无效的任务
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // 有效的任务
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      // 有效的任务
      break;
    }
    timer = peek(timerQueue);
  }
}
function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  // 把延迟任务从timerQueue中推入taskQueue中
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback();
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

export {
  NormalPriority,
  IdlePriority,
  ImmediatePriority,
  UserBlockingPriority,
  LowPriority,
  NoPriority,
  scheduleCallback,
  cancelCallback,
  getCurrentPriorityLevel,
  shouldYieldToHost,
};
