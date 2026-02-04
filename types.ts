export type UserRole = 'SUPER_ADMIN' | 'EMPLOYEE';

export type TaskType = 'LOCKED' | 'FLOATING' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'BLOCKED';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  efficiencyScore: number; // 0-100
  status: 'ONLINE' | 'IDLE' | 'OFFLINE';
  personalNotes?: string;
  username: string;
  password: string;
}

export interface Task {
  id: string;
  assigneeId: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  estimatedMinutes: number;
  elapsedSeconds: number; // Net work time
  waitSeconds: number; // Total blocked/waiting time
  priority: number; // 1 (High) - 3 (Low)
  startTimeConstraint?: string; // For LOCKED tasks (HH:MM)
  dueTime?: string;
  blockedReason?: string; // Reason for blockage
}