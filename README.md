# Wordle Solver

A Tampermonkey Wordle solver. Requires Bun 1.4 and Node.js 24 (for tsdown).

```sh
bun install --frozen-lockfile
bun run check
bun run dev
```

Write the script in `src/index.ts`. `bun run build` bundles it into
`dist/wordle-solver.user.js`, with the Tampermonkey metadata first.
Install that file in Tampermonkey, or use the latest GitHub release asset.

The `@version` in `src/index.ts` is the release version. Use stable
`major.minor.patch` versions. Pushes and pull requests run type checks
and a build. A successful push to the default branch publishes a GitHub release
and attaches the userscript when its version exceeds the latest published release.
With no previous release, the first version is published. Equal or lower versions
are checked but not released. The workflow uses the built-in `GITHUB_TOKEN`.

Git history and the existing GPL license are retained; the old application is removed.
