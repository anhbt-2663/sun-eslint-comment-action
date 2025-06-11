const core = require("@actions/core");
const github = require("@actions/github");
const { ESLint } = require("eslint");
const path = require("path");
const fs = require("fs");

(async function run() {
  try {
    const token = core.getInput("GITHUB_TOKEN", { required: true });
    const octokit = github.getOctokit(token);
    const context = github.context;

    const workspace = process.env.GITHUB_WORKSPACE;
    console.log("GITHUB_WORKSPACE:", workspace);
    console.log("📂 Directory contents:");
    console.log(fs.readdirSync(process.env.GITHUB_WORKSPACE || '.'));

    const eslint = new ESLint({
      cwd: workspace, // critical to locate .eslintrc.json
    });

    const results = await eslint.lintFiles(["src/**/*.{js,ts,tsx,jsx}"]);

    const formatter = await eslint.loadFormatter("stylish");
    const output = formatter.format(results);

    if (!output.trim()) {
      console.log("✅ No ESLint issues found.");
      return;
    }

    const commentBody = [
      "🚨 **ESLint found issues:**",
      "```",
      output.trim().slice(0, 65000), // limit GitHub comment size
      "```",
    ].join("\n");

    const { owner, repo } = context.repo;
    const pull_number = context.payload.pull_request.number;

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: commentBody,
    });

    console.log("✅ ESLint issues posted to pull request.");
  } catch (error) {
    core.setFailed(`❌ Action failed: ${error.message}`);
  }
})();