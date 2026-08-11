# Security policy

## Scope

This SDK is designed for local inspection. It does not authenticate with
providers, deploy applications, send telemetry, or perform Git write commands.

## Safe handling

- Do not commit `.env` files, credentials, databases, logs, or exported
  evidence containing unreviewed data.
- Use `redact` or `createEvidence` before sharing inspection output.
- Treat `createJsonFileStore` paths as application-owned local storage.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository owner. Do
not include credentials, tokens, hostnames, or personal identifiers in a
public issue.

