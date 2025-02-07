import type { FiberRoot } from "./ReactInternalTypes";
import { Scheduler } from "scheduler";
import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";
import { NormalPriority } from "scheduler/src/SchedulerPriorities";
export function ensureRootIsScheduled(root: FiberRoot) {
  queueMicrotask(() => {
    scheduleTaskForRootDuringMicrotask(root);
  });
}

function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
  Scheduler.scheduleCallback(NormalPriority, performConcurrentWorkOnRoot(root));
}
