// scripts/new-task.js
// Outputs a new AI task JSON skeleton to .ai-queue/tasks/

const fs = require("fs");
const path = require("path");

const tasksDir = ".ai-queue/tasks";
fs.mkdirSync(tasksDir, { recursive: true });

const now = new Date();
const id = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14); // e.g., 20240727xxxxxx
const filename = path.join(tasksDir, `task-${id}.json`);

const skeleton = {
  id,
  created: now.toISOString(),
  title: "New AI Patch Task",
  description: "Describe the patch or architectural change here.",
  risk: "LITE", // or STD or DEEP
  files: [],
  notes: ""
};

fs.writeFileSync(filename, JSON.stringify(skeleton, null, 2));
console.log(`📝  Created new AI task: ${filename}`);
