export type WorkflowMetric = {
  name: string;
  value: number;
  tags?: Record<string, string>;
  observedAt: string;
};

export function createWorkflowMetric(
  name: string,
  value: number,
  tags?: Record<string, string>,
): WorkflowMetric {
  return { name, value, tags, observedAt: new Date().toISOString() };
}
