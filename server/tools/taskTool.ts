import { TaskItem, ToolResult } from '../../src/types';
import { getSession } from '../memory';

export async function listTasks(status?: 'needsAction' | 'completed' | 'all', sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    let filtered = [...session.mockTasks];
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
      error: 'Tasks unavailable. Please check your Google Tasks connection.',
      errorCode: 'TASKS_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export async function createTask(params: { title: string; notes?: string; due?: string }, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    if (session.isGuest) {
      return {
        success: false,
        error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
        errorCode: 'GUEST_RESTRICTION',
        recoverable: true,
      };
    }

    if (!params.title) {
      return { success: false, error: 'Task title is required.', errorCode: 'INVALID_INPUT', recoverable: true };
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: params.title,
      notes: params.notes || '',
      due: params.due ? new Date(params.due).toISOString() : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'needsAction',
    };

    session.mockTasks.unshift(newTask);

    return {
      success: true,
      data: newTask,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Tasks unavailable. Please check your Google Tasks connection.',
      errorCode: 'TASKS_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export async function completeTask(taskId: string, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    if (session.isGuest) {
      return {
        success: false,
        error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
        errorCode: 'GUEST_RESTRICTION',
        recoverable: true,
      };
    }

    const task = session.mockTasks.find(
      (t) => t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase())
    );

    if (!task) {
      return {
        success: false,
        error: `Task "${taskId}" not found to complete.`,
        errorCode: 'NOT_FOUND',
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
      error: 'Tasks unavailable. Please check your Google Tasks connection.',
      errorCode: 'TASKS_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export async function deleteTask(taskId: string, sessionId: string = 'default'): Promise<ToolResult> {
  try {
    const session = getSession(sessionId);
    if (session.isGuest) {
      return {
        success: false,
        error: 'Modifications and live Google API calls are disabled in Guest Mode (Demo Mode).',
        errorCode: 'GUEST_RESTRICTION',
        recoverable: true,
      };
    }

    const index = session.mockTasks.findIndex(
      (t) => t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase())
    );

    if (index === -1) {
      return {
        success: false,
        error: `Task "${taskId}" not found to delete.`,
        errorCode: 'NOT_FOUND',
        recoverable: true,
      };
    }

    const [deleted] = session.mockTasks.splice(index, 1);

    return {
      success: true,
      data: deleted,
    };
  } catch (error: any) {
    return {
      success: false,
      error: 'Tasks unavailable. Please check your Google Tasks connection.',
      errorCode: 'TASKS_UNAVAILABLE',
      recoverable: true,
    };
  }
}

export function restoreDeletedTask(task: TaskItem, sessionId: string = 'default'): void {
  const session = getSession(sessionId);
  session.mockTasks.unshift(task);
}

