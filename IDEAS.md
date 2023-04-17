# V2. of Modules: Dynamic modules
1. Module registration/roll-call
   1. Builds dependency tree
2. Validates each module is present, and confirms with each module once dependencies are verified
   1. Throws an error for a missing module/auto install
- Each module has an OpenAPI.yaml
  - When Toolkit loads modules, it's either:
      1. Building it from file system and registering each method on the Toolkit server, OR
      2. Using the OpenAPI.yaml to autobuild types and generate dynamic http module


## Module ideas:
### Information search:
- Ask for a particular piece of information
- Queries vector db to see if it's possible
- Verifies if the match results answer the original question
- If not, uses a web search (configurable, HN, reddit, wikipedia, google, etc) with the question
  - Goes over top results, and adds each page (N setting) to the vector DB
  - Tries to redo original query/check result
- Either
  - Throw an error saying it cannot find that piece of information, or
  - returns the answer (with potential validation)
