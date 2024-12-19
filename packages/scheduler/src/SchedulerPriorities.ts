export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;
export const NoPriority = 0; // 没有优先级
export const ImmediatePriority = 1; // 立即执行
export const UserBlockingPriority = 2; // 用户阻塞
export const NormalPriority = 3; // 正常优先级
export const LowPriority = 4; // 低优先级
export const IdlePriority = 5; // 空闲优先级
