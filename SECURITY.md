# Security Policy

Thank you for helping keep Lunatory and its users safe.

## Reporting a Security Issue

Please do **not** open a public GitHub issue containing:

- passwords or PINs
- private business data
- customer or employee data
- authentication tokens
- API keys
- signing keys
- private server addresses
- detailed exploit steps that could put users at risk
- database dumps or backups containing real operational data

For a potentially sensitive security issue, contact the Lunatory project owner privately through the GitHub account associated with this repository before publishing technical details.

## What to Include

When reporting a security problem, include as much of the following as is safe to share:

- affected Lunatory version
- affected platform
- Android / Windows / Linux version
- whether the issue affects the app, server, sync, backups, authentication, camera/vision, or another component
- a concise description of the impact
- reproducible steps using test data
- relevant logs with sensitive information removed

## Supported Releases

Lunatory is under active development. Security fixes may target the newest available release rather than every historical build.

Users should keep independent backups and test upgrades before relying on a new release for business-critical workflows.

## Credentials and Secrets

Never commit or upload real credentials, production database files, signing keys, or private configuration secrets to the public Lunatory repository.

If a secret is accidentally exposed publicly, treat it as compromised and rotate/revoke it rather than relying only on deleting the file.

## Third-Party Components

Security issues originating in third-party dependencies may also be subject to the upstream project's reporting process and update schedule.