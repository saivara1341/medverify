export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
}

export type ServerMessage = 
  | { type: 'presence'; users: UserPresence[] }
  | { type: 'task:updated'; task: Task }
  | { type: 'task:created'; task: Task };
