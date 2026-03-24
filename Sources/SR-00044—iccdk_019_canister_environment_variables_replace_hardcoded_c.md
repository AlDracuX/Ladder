---
id: SR-00044
title: "ic-cdk 0.19 canister environment variables replace hardcoded configuration"
type: paper
url: "https://github.com/dfinity/cdk-rs/blob/main/ic-cdk/CHANGELOG.md"
status: active
updated: 2026-03-23
created: 2026-03-24
tags: [ic-cdk, environment-variables, configuration, canister-settings]
domain: "canister-configuration"
relevance: "medium"
---

## Summary

ic-cdk 0.19.0 introduced canister environment variable support via `env_var_*` bindings, enabling canisters to read configuration values set at deploy time without hardcoding them. This replaces patterns where constants like `MAX_RECORDS_PER_USER`, authorized canister IDs, or feature flags are baked into the WASM binary and require recompilation to change.

## Key Points

- New `env_var_*` APIs allow reading deploy-time configuration from the canister environment
- Values can be set via `icp canister install --env-var KEY=VALUE` or equivalent
- Eliminates the need to recompile and redeploy just to change a configuration constant
- Particularly useful for values that differ between local, staging, and production environments
- Available in ic-cdk 0.19.0+ (our current dependency version)

## Connection to Problems

Connects to SR-00006 (uk_caps.rs hardcoded 2025-26 rates with no sunset mechanism) and ID-00003 (statutory rate sunset). While statutory rates shouldn't be fully dynamic (they're law), the env var pattern could solve the deployment-time configuration problem — set the "current statutory year" as an env var, and the canister selects the correct rate table at startup without recompilation.

## Potential Ideas

- Replace `MAX_RECORDS_PER_USER` constant with env var for per-deployment quota tuning
- Use env vars for authorized_canisters lists instead of hardcoded Principal arrays
- Set feature flags via env vars instead of the current `set_feature_flags` controller endpoint
