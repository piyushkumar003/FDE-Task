import { TaskItem, ToolResult } from '../../src/types';

let mockTasks: TaskItem[] = [
  {
    id: 'task-101',
    title: 'Submit quarterly engineering report',
    notes: 'Include architecture diagrams for Gemini agentic workflow and FastAPI routes',
    due: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    status: 'needsAction',
  },
  {
    id: 'task-102',
    title: 'Buy groceries for weekly meal prep',
    notes: 'Organic spinach, almond milk, coffee beans, salmon fillets',
    due: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
    status: 'needsAction',
  },
  {
    id: 'task-103',
    title: 'Review pull request #402 for Google OAuth refactor',
    notes: 'Check scope handling and token auto-refresh strategy',
    due: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'completed',
    completedDate: new Date().toISOString(),
  },
];

export async function listTasks(status?: 'needsAction' | 'completed' | 'all'): Promise<ToolResult> {
  try {
    let filtered = [...mockTasks];
    if (status && status !== 'all') {
      filtered = filtered.filter((t) => t.status === status);
    }
    return {
      success: true,
      data: filtered,
    };
  } catch (error: any) {
    return {
      success: false,
      reason: error?.message || 'Failed to list tasks',
      recoverable: true,
    };
  }
}

export async function createTask(params: { title: string; notes?: string; due?: string }): Promise<ToolResult> {
  try {
    if (!params.title) {
      return { success: false, reason: 'Task title is required.', recoverable: true };
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: params.title,
      notes: params.notes || '',
      due: params.due ? new Date(params.due).toISOString() : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'needsAction',
    };

    mockTasks.unshift(newTask);

    return {
      success: true,
      data: newTask,
    };
  } catch (error: any) {
    return {
      success: false,
      reason: error?.message || 'Failed to create task',
      recoverable: true,
    };
  }
}

export async function completeTask(taskId: string): Promise<ToolResult> {
  try {
    const task = mockTasks.find(
      (t) => t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase())
    );

    if (!task) {
      return {
        success: false,
        reason: `Task "${taskId}" not found to complete.`,
        recoverable: true,
      };
    }

    task.status = 'completed';
    task.completedDate = new Date().toISOString();

    return {
      success: true,
      data: task,
    };
  } catch (error: any) {
    return {
      success: false,
      reason: error?.message || 'Failed to complete task',
      recoverable: true,
    };
  }
}

export async function deleteTask(taskId: string): Promise<ToolResult> {
  try {
    const index = mockTasks.findIndex(
      (t) => t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase())
    );

    if (index === -1) {
      return {
        success: false,
        reason: `Task "${taskId}" not found to delete.`,
        recoverable: true,
      };
    }

    const [deleted] = mockTasks.splice(index, 1);

    return {
      success: true,
      data: deleted,
    };
  } catch (error: any) {
    return {
      success: false,
      reason: error?.message || 'Failed to delete task',
      recoverable: true,
    };
  }
}

export function restoreDeletedTask(task: TaskItem): void {
  mockTasks.unshift(task);
}
