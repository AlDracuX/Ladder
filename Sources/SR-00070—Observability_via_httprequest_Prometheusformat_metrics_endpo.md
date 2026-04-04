---
id: SR-00070
title: "Observability via http_request: Prometheus-format metrics endpoint for canister monitoring"
type: paper
url: "https://mmapped.blog/posts/01-effective-rust-canisters"
status: draft
created: 2026-03-27
tags: [observability, monitoring, metrics, http_request]
domain: "all-canisters"
relevance: "medium"
---

## Summary

Expose canister operational metrics via the `http_request` query endpoint using Prometheus text exposition format. This allows external monitoring tools (Grafana, Prometheus scraper) to collect cycle balance, stable memory usage, record counts, error rates, and request latency from each canister without custom tooling. Recommended in "Effective Rust Canisters" and used by Internet Identity canister in production.

## Key Points

- Implement `http_request` query method that responds to `GET /metrics` with Prometheus text format
- Expose: cycle balance, stable memory pages used, heap memory used, record counts per store, error counters
- Query calls are free (no cycles cost to the caller) making scraping economical
- Prometheus text format: `canister_records_total{store="evidence"} 1234`
- Can gate metrics behind controller-only access or expose publicly for transparency
- Combine with `instruction_counter()` to track per-endpoint instruction costs over time

## Connection to Problems

Currently, Awen canisters have no runtime observability. The only monitoring is the daily telemetry entries (SR-00007/08/09/15) which capture test counts and issue counts — not runtime metrics. During production operation, there would be no way to detect: memory pressure approaching limits, cycle balance running low, specific endpoints consuming disproportionate instructions, or storage quotas approaching capacity. All 9 canisters would benefit from a shared metrics module.

## Potential Ideas

- Create `packages/awen_metrics` shared crate with Prometheus text formatter
- Add `http_request` handler to each canister with standard metric set
- Include canister-specific metrics: evidence count for evidence_vault, deadline counts for deadline_alerts
- Wire into admin-dashboard for a live canister health panel
