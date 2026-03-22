# Shopify Theme Setup

This repo is ready to hold one Shopify theme and sync it with Shopify CLI.

## One-time setup

1. Open `shopify.theme.toml` and set `store` to your store URL.
2. Pick your auth method:
   - Keep `password` commented to log in with a Shopify staff/collaborator account.
   - Uncomment `password` if you're using a Theme Access password.
3. Run `scripts\\theme-list.cmd` to list the store themes and copy the ID of the exact theme you want this repo to manage.
4. Paste that ID into `shopify.theme.toml` as `theme = "..."`.
5. Run `scripts\\theme-pull.cmd` to download the theme code into this repo.

## Daily workflow

- Preview locally with `scripts\\theme-dev.cmd`
- Pull the latest remote code with `scripts\\theme-pull.cmd`
- Push your local changes back with `scripts\\theme-push.cmd`

## Notes

- The first CLI command may open a browser for Shopify login. Use the account that has access to the store's themes.
- If Shopify CLI is logged into the wrong account, run `"%AppData%\\npm\\shopify.cmd" auth logout` and then rerun a theme command.
- Open a new terminal window after the installs so `git` is available on your PATH.
- If you want to connect this local repo to GitHub later, add a remote and push as usual with Git.
