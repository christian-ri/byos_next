# GitHub Monitor

Black-and-white 800x480 TRMNL dashboard for GitHub repositories, pull requests, issues, workflow runs, commits, releases, and optional security alerts.

## Included files

- `settings.json`
  Defines the expected private-plugin configuration fields.
- `template.liquid`
  Static TRMNL-compatible markup.
- `styles.css`
  Fixed-size 800x480 eInk styling.
- `mock-data.json`
  Normalized sample payload for local testing and previewing.

## Recommended data source

This repo now includes a matching JSON endpoint at:

`/api/github-monitor`

Example:

```text
https://your-byos-host.example.com/api/github-monitor?owner=christian-ri&repositories=repo-a,repo-b&timezone=Europe/Berlin
```

The endpoint reads `GITHUB_TOKEN` from the server environment and supports:

- `owner`
- `repositories`
- `includePrivateRepos`
- `staleDays`
- `timezone`
- `maxRepos`
- `maxWorkflowRuns`

## Environment variables

For the built-in endpoint, set:

```bash
GITHUB_TOKEN=ghp_xxx
GITHUB_OWNER=christian-ri
REPOSITORIES=
INCLUDE_PRIVATE_REPOS=true
STALE_DAYS=14
TIMEZONE=Europe/Berlin
MAX_REPOS=6
MAX_WORKFLOW_RUNS=5
```

## Private plugin wiring

1. Create a private plugin in TRMNL called `GitHub Monitor`.
2. Point its data source to your deployed `/api/github-monitor` endpoint.
3. Paste `template.liquid` into the markup/template field.
4. Paste `styles.css` into the CSS field.
5. Mirror the config schema from `settings.json`.

## Notes

- Security alert endpoints gracefully fall back to `n/a` on `403` or `404`.
- The endpoint caches recent results in memory for 15 minutes and reuses cached data on transient failures.
- If the token or owner is missing, the recipe falls back to `mock-data.json`-style preview data instead of failing.
