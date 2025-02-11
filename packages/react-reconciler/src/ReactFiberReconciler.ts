import type { ReactNodeList } from "shared/ReactTypes";
import type { FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  // 获取current，也就是fiber树的根节点
  const current = container.current;

  current.memoizedState = {
    element,
  };
  console.log("current", current);
  console.log("container", container);

  // 调度更新
  scheduleUpdateOnFiber(container, current);
}
