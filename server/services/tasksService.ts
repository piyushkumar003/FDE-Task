import { listTasks, createTask, completeTask, deleteTask } from '../tools/taskTool';

export async function listTasksService(sessionId: string = 'default') {
  try {
    const res = await listTasks('all', sessionId);
    return {
      success: res.success,
      data: res.data || [],
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Tasks service unavailable',
    };
  }
}

export async function createTaskService(params: { title: string; due?: string }, sessionId: string = 'default') {
  try {
    const res = await createTask(params, sessionId);
    return {
      success: res.success,
      data: res.data || null,
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to create task',
    };
  }
}

export async function updateTaskService(taskId: string, params: any, sessionId: string = 'default') {
  try {
    const res = await completeTask(taskId, sessionId);
    return {
      success: res.success,
      data: res.data || null,
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to update task',
    };
  }
}

export async function deleteTaskService(taskId: string, sessionId: string = 'default') {
  try {
    const res = await deleteTask(taskId, sessionId);
    return {
      success: res.success,
      data: res.data || null,
      error: res.error || null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Failed to delete task',
    };
  }
}
