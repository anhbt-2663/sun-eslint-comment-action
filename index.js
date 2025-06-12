const core = require("@actions/core");
const github = require("@actions/github");
const { ESLint } = require("eslint");
const path = require("path");
const fg = require("fast-glob");
const fs = require("fs").promises;

async function listFiles() {
  const cwd = process.env.GITHUB_WORKSPACE || process.cwd();
  const pattern = "**/*.{js,ts,jsx,tsx}";

  // Tìm file theo pattern, ignore node_modules mặc định
  const files = await fg(pattern, {
    cwd,
    ignore: ["**/node_modules/**"],
    absolute: true,
  });

  console.log("📄 Files to lint:", files);
  return files;
}

(async function run() {
  try {
    const token = core.getInput("GITHUB_TOKEN", { required: true });
    const octokit = github.getOctokit(token);
    const context = github.context;

    // const cwd = process.env.GITHUB_WORKSPACE || process.cwd();
    // console.log("✅ Using cwd for ESLint:", cwd);

    // todo for eslint
    // let configPath = path.join(cwd, ".eslintrc.json");
    // configPath = configPath.split("?")[0];

    // if (!fs.existsSync(configPath)) {
    //   console.error("❌ ESLint config not found at:", configPath);
    // } else {
    //   console.log("✅ ESLint config found at:", configPath);
    // }

    // const eslint = new ESLint({
    //   cwd,
    //   overrideConfigFile: configPath,
    // });

    // console.log("eslint", eslint);

    // const results = await eslint.lintFiles(files);

    // console.log(results);

    // const formatter = await eslint.loadFormatter("stylish");
    // const output = formatter.format(results);

    // if (!output.trim()) {
    //   console.log("✅ No ESLint issues found.");
    //   return;
    // }

    // const commentBody = [
    //   "🚨 **ESLint found issues:**",
    //   "```",
    //   output.trim().slice(0, 65000), // limit GitHub comment size
    //   "```",
    // ].join("\n");

    // await octokit.rest.issues.createComment({
    //   owner,
    //   repo,
    //   issue_number: pull_number,
    //   body: commentBody,
    // });

    // const files = await listFiles();
    // let updatedCount = 0;

    // for (const file of files) {
    //   try {
    //     const content = await fs.readFile(file, "utf8");

    //     // Nếu đã có comment thì bỏ qua
    //     if (content.startsWith("// Processed by GitHub Action")) {
    //       console.log(`ℹ️ Skipped ${file}`);
    //       continue;
    //     }

    //     const newContent = `// Processed by GitHub Action\n${content}`;
        
    //     await fs.writeFile(file, newContent, "utf8");
    //     console.log(`✅ Updated: ${file}`);
    //     updatedCount++;
    //   } catch (err) {
    //     console.error(`❌ Failed to update ${file}:`, err.message);
    //   }
    // }

    // if (updatedCount === 0) {
    //   console.log("✅ No files needed updating.");
    // } else {
    //   console.log(`✅ ${updatedCount} files updated with comment.`);
    // }

    const { owner, repo } = context.repo;
    const pull_number = context.payload.pull_request.number;
    const commit_id = context.payload.pull_request.head.sha;

    const { data: filesChanged } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    console.log(`🔍 ${filesChanged.length} file(s) changed in PR`);

    const validExtensions = [".ts", ".tsx", ".js", ".jsx"];

    for (const file of filesChanged) {
      const filePath = file.filename;
      const ext = path.extname(filePath);

      if (!validExtensions.includes(ext)) {
        console.log(`⏭️ Skipping file (not ts/js): ${filePath}`);
        continue;
      }

      try {
        await octokit.rest.pulls.createReviewComment({
          owner,
          repo,
          pull_number,
          commit_id,
          path: filePath,
          line: 1, // chỉ comment ở dòng 1 nếu có trong diff
          side: "RIGHT",
          body: `📄 Đã xử lý file: \`${filePath}\``,
        });

        console.log(`💬 Commented on: ${filePath}`);
      } catch (err) {
        console.warn(`⚠️ Không thể comment vào ${filePath}: ${err.message}`);
      }
    }

    if (pull_number) {
      const commentBody = `🔧 GitHub Action processed ${updatedCount} file(s) with comment header.`;
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pull_number,
        body: commentBody,
      });
      console.log("💬 Comment posted to PR.");
    }

    console.log("✅ ESLint issues posted to pull request.");
  } catch (error) {
    console.error("❌ ESLint failed:");
    console.error(error.message);
    console.error(error.stack);
    core.setFailed(`❌ Action failed: ${error.message}`);
  }
})();
