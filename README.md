# xiaoji-sdk

`xiaoji-sdk` is a small, dependency-free Node.js SDK for safely inspecting
local project artifacts and creating redacted, portable evidence records.

It requires Node.js 18 or newer, uses CommonJS by default, and never logs in
to providers, deploys remotely, or writes Git history. Repository inspection
uses read-only Git commands only.

## Install

```sh
npm install xiaoji-sdk
```

The package supports Node.js 18 and newer. It is CommonJS-first; ESM callers
can use a default import from the CommonJS entrypoint.

## API

```js
const sdk = require('xiaoji-sdk');

const repo = sdk.inspectRepository(process.cwd());
const evidence = sdk.createEvidence({
  kind: 'repository',
  subject: { path: repo.path },
  findings: [{ clean: repo.clean }]
});
const validation = sdk.validateEvidence(evidence);
```

The public API is:

- `inspectRepository(directory)` — runs only allowlisted, read-only Git
  inspection commands and never returns remote URLs.
- `inspectRenderBlueprint(fileOrObject)` — summarizes Render YAML/JSON service
  declarations and environment-variable keys, never their values.
- `inspectLavalinkConfig(fileOrObject)` — reports configuration presence and
  validation gaps without returning addresses or passwords.
- `normalizeTrackUserData(value)` — normalizes common requester/user metadata.
- `replyWithReferenceFallback(target, payload, reference)` — tries a referenced
  reply, then retries a plain reply if that reference fails.
- `inspectPersistencePaths(root, candidates)` — checks conventional local
  persistence paths without reading their contents.
- `createJsonFileStore(file)` — supplies atomic local JSON `read`/`write`.
- `redact(value)` — removes sensitive key values and URLs from nested data.
- `createEvidence(input)` and `validateEvidence(value)` — create and verify the
  `evidence-v1` document contract.

`evidence-v1` requires `schema`, `createdAt`, `kind`, `subject`, `findings`,
and `metadata`; its JSON Schema is at `schemas/evidence-v1.schema.json`.

## CLI

```sh
xiaoji-sdk repo inspect .
xiaoji-sdk render inspect ./render.yaml
xiaoji-sdk lavalink inspect ./application.yml
xiaoji-sdk persistence inspect .
xiaoji-sdk evidence validate ./evidence.json
```

All CLI output is JSON except help. `evidence validate` exits with code `1`
when its input is invalid. The CLI does not log in, deploy, write Git state, or
contact a network service.

## Development

```sh
npm ci
npm run check
npm test
npm audit --omit=dev --audit-level=high
npm pack --dry-run
```

The CI matrix covers Node 18, 20, and 22 on Ubuntu and Windows. Fixtures are
synthetic and intentionally exclude credentials, provider hostnames, logs,
SQLite files, and environment files.

