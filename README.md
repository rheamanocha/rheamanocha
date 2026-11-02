# Rhea's portfolio

A plain HTML, CSS, and JavaScript site. There's no build step. All words live in `content/`, and the pages read them at load time.

## Three ways to update it

1. **Ask Claude.** Send the change ("add this project", "change my headline") and Claude edits the files.
2. **Edit the files.** `content/site.json` holds the home page, about page, links, and lab. Each case study is its own file in `content/case-studies/`.
3. **Use the browser editor.** Go to `yoursite.com/admin` for forms instead of files (setup below).

## Add a case study

1. Copy a file in `content/case-studies/` and rename it, for example `my-project.json`.
2. Change `slug` to match the file name (lowercase, dashes).
3. Add the slug to `featured` in `content/site.json` so it appears on the home page.
4. Set `draft` to `false` when it's ready.

Section types: `text`, `bullets`, `image`, `metrics`, `quote`. Copy one from an existing file.

## Lenses: one site, tailored links

A lens is a version of the home page for one kind of company. It reorders your projects and swaps the headline and intro. Send the matching link with each application:

- `yoursite.com/#for-ai` for AI-native companies
- `yoursite.com/#for-enterprise` for enterprise and productivity
- `yoursite.com/#for-video` for video
- `yoursite.com/#for-health` for health

The plain `yoursite.com` stays your default version. Lenses live in the `lenses` list in `content/site.json`. To add one, copy an entry, change `key`, and share `#for-<key>`. Visitors stay in their lens as they open projects and return.

## Replace placeholders

- `links.linkedin` in `content/site.json`: your real LinkedIn URL.
- `links.resume`: put your PDF at `assets/resume.pdf`, or change the path.
- `links.email`: add it to show an email button, leave blank to hide.
- `cover.image` in a case study: a screenshot replaces the generated cover art. Put images in `assets/img/`.
- Check company approval before publishing real Microsoft screenshots.

## Preview on your computer

Pages load content with `fetch`, so open them through a local server:

    python3 -m http.server 8000

Then visit http://localhost:8000.

## Publish with Netlify and turn on the editor

1. Put this folder in a GitHub repo.
2. In Netlify, choose Add new site, then Import from Git, and pick the repo. No build command, publish directory `.`.
3. Point rheamanocha.me at the site in Netlify's domain settings.
4. For `/admin`: in Netlify go to Site configuration, Access and security, OAuth, and install a GitHub provider. Then set `repo` in `admin/config.yml`.
