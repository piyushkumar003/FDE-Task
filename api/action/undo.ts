import { popUndoItem } from '../../server/memory';
import { delete_event, restoreDeletedEvent } from '../../server/tools/calendarTool';
import { deleteTask, restoreDeletedTask } from '../../server/tools/taskTool';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { actionId, sessionId = 'default' } = req.body || {};
  const undoItem = popUndoItem(sessionId, actionId);

  if (!undoItem) {
    return res.status(404).json({ success: false, message: 'No action found to undo.' });
  }

  try {
    if (undoItem.actionType === 'calendar.create') {
      await delete_event(undoItem.itemData.id);
      return res.json({ success: true, message: `Reverted creation of event "${undoItem.itemData.summary}".` });
    } else if (undoItem.actionType === 'calendar.delete') {
      restoreDeletedEvent(undoItem.itemData);
      return res.json({ success: true, message: `Restored deleted event "${undoItem.itemData.summary}".` });
    } else if (undoItem.actionType === 'tasks.create') {
      await deleteTask(undoItem.itemData.id);
      return res.json({ success: true, message: `Reverted creation of task "${undoItem.itemData.title}".` });
    } else if (undoItem.actionType === 'tasks.delete') {
      restoreDeletedTask(undoItem.itemData);
      return res.json({ success: true, message: `Restored deleted task "${undoItem.itemData.title}".` });
    }
    return res.json({ success: true, message: 'Undo action processed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to undo action' });
  }
}
