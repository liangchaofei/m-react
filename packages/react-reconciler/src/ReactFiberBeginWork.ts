import type { Fiber } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";

export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
  }
  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue."
  );
}

function updateHostRoot(current: Fiber | null, workInProgress: Fiber): Fiber {
  // Add your logic here to update the host root and return a Fiber object
  return workInProgress.child;
}
