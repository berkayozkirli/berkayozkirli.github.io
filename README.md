# Berkay Özkırlı — GitHub Pages website

 Configured for the repository `berkayozkirli/berkayozkirli.github.io` and the future address `https://berkayozkirli.github.io`.

## First deployment

1. On GitHub, create an empty **public** repository named exactly **berkayozkirli.github.io** under the **berkayozkirli** account. Do not initialize it with a README, license, or gitignore; these files are included here. If that repository already exists, merge these files into it instead of replacing existing work.
2. Extract the supplied ZIP. Open a terminal in the extracted folder containing `package.json`. The ZIP contains the project files directly, without an outer directory. Ensure the hidden `.github/` folder is included.
3. Run:

```sh
git init -b main
git add .
git commit -m "Add personal website"
git remote add origin https://github.com/berkayozkirli/berkayozkirli.github.io.git
git push -u origin main
```

Use your normal GitHub authentication when Git prompts. No deployment secrets or access tokens need to be added to this project.

4. In the repository, open **Settings → Pages**. Under **Build and deployment → Source**, select **GitHub Actions**.
5. In **Actions → Publish website**, run the workflow on `main` if the initial push did not deploy successfully because Pages was not yet enabled. You can also select **Re-run all jobs** on the first failed run.
6. Wait for both the build and deploy jobs to pass. The deployment URL is shown in the workflow and under **Settings → Pages**.

The workflow installs dependencies, builds the Markdown to `dist/`, checks the generated links, and publishes only `dist/`. Future pushes to `main` automatically repeat this process.

This GitHub Pages deployment is a public website. With a public repository, source files—including posts marked as drafts—are public too. Draft posts are excluded from the generated website.

## Everyday editing

| File                      | Content                       |
| ------------------------- | ----------------------------- |
| `content/about.md`      | Homepage bio                  |
| `content/cv.md`         | CV                            |
| `content/projects/*.md` | Projects                      |
| `content/posts/*.md`    | Blog posts                    |
| `site.json`             | Contact links, name, site URL |
| `public/style.css`      | Styling                       |

Edit and commit any Markdown file in GitHub's web editor, or edit locally and push to `main`. GitHub Actions publishes the changes automatically. No local build is needed when editing through GitHub.

To publish a post, copy `content/posts/first-note.md` to a new filename, edit its title, date, summary, and body, and change `draft: true` to `draft: false`. The filename becomes its URL. Dates use `YYYY-MM-DD` and determine sort order; a non-draft post with a future date will also be published.

## Local preview

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Visit `http://127.0.0.1:4173`. Content changes rebuild automatically; refresh the browser to view them.

```sh
npm run build
npm run check
```

## Domain and repository names

Use the exact repository name above for a user website at the domain root. A repository with another name normally produces a project website under a subdirectory; the site's current root-relative links would need to be adapted for that.

For a custom domain, set it under **Settings → Pages → Custom domain**, follow GitHub's DNS instructions, and change `url` in `site.json` to the final HTTPS address so RSS links use the right domain.

Official references:

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
