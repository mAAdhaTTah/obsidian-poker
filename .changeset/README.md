# Changesets

Every PR that changes the plugin for users needs a changeset. Run `npx changeset`, pick the bump type, and write the release note users will read. It can be as long as it needs to be.

Merging to `main` opens or updates a "Release" PR that bumps the version and adds the notes to `CHANGELOG.md`. Merging that PR publishes the GitHub release.
