# sun-eslint-comment-action
# Sticky Pull Request Comment Action

Create or update sticky comments in Pull Requests — helpful for tools like ESLint, test reports, etc.

## 🔧 Usage

```yaml
- uses: your-org/sticky-pr-comment@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    message: |
      ### 🔧 ESLint Report
      ```
      10 problems found
      ```
    sticky-identifier: eslint
