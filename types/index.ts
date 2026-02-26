// types/index.ts

export type Role = 'admin' | 'ceo' | 'employee' | 'worker'
export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'open' | 'done'
export type RequestStatus = 'pending' | 'inprogress' | 'done'
export type IdType = 'id' | 'passport'

export interface Company {
  id: string
  name: string
  field: string
  emoji: string
  color: string
  sig_password?: string
  created_at?: string
}

export interface User {
  id: number
  username: string
  name: string
  role: Role
  company_id: string | null
  avatar: string
  avatar_color: string
  id_type: IdType
  id_number?: string
  ceo_interface: boolean
  field_worker: boolean
  created_at?: string
}

// User with password — only used server-side, never sent to client
export interface UserWithPassword extends User {
  password_hash: string
}

export interface Task {
  id: number
  title: string
  description?: string
  assigned_to: number | null
  assigned_by: number | null
  company_id: string
  priority: Priority
  status: TaskStatus
  due_date?: string
  created_by_emp: boolean
  subtasks?: Subtask[]
  created_at?: string
}

export interface Subtask {
  id: number
  task_id: number
  title: string
  done: boolean
}

export interface WorkerHours {
  id: number
  worker_id: number
  work_date: string   // YYYY-MM-DD
  start_time?: string
  end_time?: string
  hours: number
  note?: string
}

export interface Signature {
  id: number
  worker_id: number
  company_id: string
  year: number
  month: number
  type: 'full' | 'partial'
  days?: number[]
  signed_at: string
}

export interface Request {
  id: number
  worker_id: number
  worker_name: string
  company_id: string
  type: string
  text: string
  status: RequestStatus
  reply?: string
  created_at: string
}

export interface Note {
  id: number
  user_id: number
  content: string
  updated_at: string
}

// JWT payload stored in cookie
export interface SessionPayload {
  userId: number
  username: string
  role: Role
  companyId: string | null
  ceoInterface: boolean
  fieldWorker: boolean
}
