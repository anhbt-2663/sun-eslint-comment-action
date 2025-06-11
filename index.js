const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });
    const message = core.getInput("message", { required: true });
    const stickyId = core.getInput("sticky-identifier", { required: true });

    const octokit = github.getOctokit(token);
    const context = github.context;

    const { owner, repo } = context.repo;
    const issue_number = context.payload.pull_request?.number;

    if (!issue_number) {
      throw new Error("This action only works on pull_request events.");
    }

    const stickyMarker = `<!-- sticky:${stickyId} -->`;
    const fullMessage = `${stickyMarker}\n${message}`;

    const comments = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number,
    });

    const existing = comments.data.find(comment =>
      comment.body?.includes(stickyMarker)
    );

    if (existing) {
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existing.id,
        body: fullMessage,
      });
      console.log(`🔁 Updated comment with id ${existing.id}`);
    } else {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: fullMessage,
      });
      console.log("🆕 Created new sticky comment.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();