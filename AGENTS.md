##PROJECT VISION
self-hosted cloud IDE dashboard for managing code-server environments

Read AGENTS.md first.


We are turning this project into VibeIDE: a dashboard that manages a self-hosted code-server environment.

Build MVP v1 only.


Core idea:
- The dashboard runs on the same Ubuntu server as code-server.
- It manages projects inside /home/ubuntu/projects only.
- It must never access files outside /home/ubuntu/projects.
- It should link to the code-server IDE.

MVP v1 features:
1. Show all project folders in /home/ubuntu/projects
2. Create a new project folder
3. Delete a project folder, but require confirmation in the UI
4. Show basic system info: CPU, memory, disk
5. Show an “Open IDE” button that opens http://SERVER_IP:8080
6. Add a clean README explaining install and run steps

Use the existing project structure if one exists.
Do not overengineer.
Do not add authentication yet.
Make the smallest working version.
After changes, tell me the exact commands to run.