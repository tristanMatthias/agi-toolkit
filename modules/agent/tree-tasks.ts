// NOTE: This is deprecated code. It is here for reference only.

import ModuleAgent from './Agent.module';

export default async function (agentModule: ModuleAgent) {
  // Outer loop for top level task selection/creation
  while (true) {
    let topLevelTask = await agentModule.selectTaskToResume();
    if (!topLevelTask) {
      await agentModule.container.ui.say("Executor", "I currently have no tasks to work on. Let's create one!");
      topLevelTask = await agentModule.createTopLevelTasks();
    }

    // Inner loop for task execution
    innerLoop:
    while (true) {
      const tree = await agentModule.planner.getTaskTree({ taskId: topLevelTask.id });
      const action = await agentModule.getNextActionFromTree(tree);

      if (!action) {
        agentModule.container.ui.success("All tasks completed!");
        break;
      }

      switch (action.type) {
        case "plan":
          try {
            await agentModule.planner.planTask({ taskId: action.task.id });
          } catch (e) {
            agentModule.container.ui.error(
              "Executor",
              `Sorry, I ran into an error while planning that task with the message:\n\n${chalk.redBright((e as Error).message)}\n`
            );
            agentModule.container.ui.inform("Returning to top level task selection…\n\n");
            break innerLoop;
          }
          break;
        case "execute":
          await agentModule.executor.executeTask(action.task);
          break;
      }
    }
  }
}
