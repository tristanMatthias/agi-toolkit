# AGI Toolkit

AGI Toolkit is an open standard for building module AGI systems, and the tooling to do so.

## Modules

### Chat (`/module/chat`):
**Description:**
Interface for Q&A style LLM interactions

**Inputs:**
- Prompt
- Context

**Output**
- Text/instructions


### Data (`/module/data`):
**Description:**
Store relevant and important information in long term memory. Uses a vector database to store documents, images, etc.

**Inputs:**
- Media Embeddings and related metadata
- Queries ro run against memories

**Outputs:**
- Memories/files

### Executer (`/module/executor`)
**Description:**
Responsible for popping a thought/plan/action of the consciousness/thought queue and delegating to appropriate task/module

### Log (`/module/log`)
**Description:**
Logs the status of any task or error that happens in the AGI


## Tasks
### Write file
**Description:**
Writes data to a file

### Search
**Description:**
Searches the internet for information


## Event Loop
### Initialization
- Setup AGIs name/purpose/role
- Establish goals


For each goal, spin up a "mission". A mission has an end goal in mind, and can spin up nested sub-tasks to accomplish what needs to be done.

### Plan
- Based on the current mission/task, generate a set of either:
  - Tasks to accomplish that map directly to a "Task", OR
  - A subtask that will need to be planned
- Organize these items in order of priority
- Once user confirms plan, the mission plan is added to the queue

### Execute
- Continually pop next task/subtask to do from mission queue
- If it's a subtask, plan it, and prepend to mission queue
- If it's a normal task, execute it with the current mission/task chain

### Report
- Once last task/subtask is completed, complete the mission with a report on the success/failure for it, and any other information work noting (memories, thoughts, actions taken, etc)
