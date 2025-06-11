const core = require("@actions/core");
const github = require("@actions/github");
const { ESLint } = require("eslint");

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });
    const stickyId = "eslint-report";

    const octokit = github.getOctokit(token);
    const context = github.context;

    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request?.number;
    const eslint = new ESLint();

    if (!prNumber) throw new Error("Not triggered by pull_request.");

    // Get changed files in the PR
    const filesChanged = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    const jsFiles = filesChanged
      .map((f) => f.filename)
      .filter((file) => file.endsWith(".js") || file.endsWith(".ts")); // you can modify this

    if (jsFiles.length === 0) {
      console.log("No JS/TS files changed. Skipping ESLint.");
      return;
    }

    if (jsFiles.length > 0) {
      const config = await eslint.calculateConfigForFile(jsFiles[0]); // hoặc lặp từng file
      console.log("📋 ESLint Rules for first file:");
      console.log(JSON.stringify(config.rules, null, 2));
    }

    console.log("Running ESLint on files:", jsFiles);

    const results = await eslint.lintFiles(jsFiles);
    const formatter = await eslint.loadFormatter("stylish");
    const formatted = formatter.format(results);

    const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);

    const stickyMarker = `<!-- sticky:${stickyId} -->`;
    const commentBody =
      errorCount > 0
        ? `${stickyMarker}\n### ❌ ESLint found ${errorCount} issue(s):\n\`\`\`\n${formatted}\n\`\`\``
        : `${stickyMarker}\n✅ ESLint found no issues.`

    // Get existing comment
    const comments = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
    });

    const existing = comments.data.find((c) => c.body?.includes(stickyMarker));

    if (existing) {
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existing.id,
        body: commentBody,
      });
      console.log("🔁 Updated ESLint comment.");
    } else {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
      });
      console.log("🆕 Created ESLint comment.");
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();