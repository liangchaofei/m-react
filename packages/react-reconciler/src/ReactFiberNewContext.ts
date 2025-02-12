import { ReactContext } from "shared/ReactTypes";
// 2. 后代组件消费
export function readContext<T>(context: ReactContext<T>): T {
  return context._currentValue;
}
