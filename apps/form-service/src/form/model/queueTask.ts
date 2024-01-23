export interface QueueTaskDefinition {
  name: string;
  namespace: string;
  id: string;
  recordId?: string;
  description: string;
  priority: 'Normal' | 'High' | 'Urgent';
  createdOn?: string;
  status?: string;
}
