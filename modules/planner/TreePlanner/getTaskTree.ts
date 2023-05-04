import { ModuleData, ModuleDataQueryResult, ModulePlannerTask } from "@agi-toolkit//types";

type Task = ModulePlannerTask;

export default async function (rootTaskId: string, data: ModuleData): Promise<Task> {
  async function fetchChildren(parentTaskId: string | null): Promise<Task[]> {
    const result: ModuleDataQueryResult = await data.query({
      entity: 'task',
      query: { parentTaskId },
    });
    return result.data as Task[];
  }

  async function buildTree(task: Task): Promise<Task> {
    if (!task.children) task.children = [];
    const children = await fetchChildren(task.id);
    for (const child of children) {
      task.children.push(await buildTree(child));
    }
    return task;
  }

  const { data: [rootTask] } = await data.findById({ entity: "task", id: rootTaskId });
  if (!rootTask) throw new Error(`Root task with id ${rootTaskId} not found.`);
  return buildTree(rootTask);
}
