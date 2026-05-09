# @pobo/cli — public build artifact

This repository is the **compiled output** of [`@pobo/cli`](https://www.npmjs.com/package/@pobo/cli), published here as a transparency mirror so anyone can audit the JavaScript that ships to npm.

The source code is private. This repo is the build artifact — it contains the same files that the npm tarball contains.

## Install

```bash
npm install -g @pobo/cli
```

The package on npm and the contents of this repository are produced from the same release pipeline. To verify, compare a tagged commit here against the matching version on npm:

```bash
npm pack @pobo/cli@1.0.2
# unpack the tarball and diff its contents against this repo at tag v1.0.2
```

## Documentation

- npm package — https://www.npmjs.com/package/@pobo/cli
- Bug reports & feature requests — https://github.com/pobo-builder/pobo-cli/issues
- Changelog — see [CHANGELOG.md](./CHANGELOG.md)

## License

MIT — see [LICENSE](./LICENSE).

## Notes

- Pull requests are not accepted in this repository (it is a read-only mirror of build output). Open an issue if you want to discuss a change.
- The build is produced from a private source repository. The compiled JavaScript here is what is shipped; sourcemaps are intentionally not included.
