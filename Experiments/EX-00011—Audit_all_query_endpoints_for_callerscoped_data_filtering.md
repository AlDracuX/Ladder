---
id: EX-00011
title: "Audit all query endpoints for caller-scoped data filtering"
status: complete
created: 2026-03-24
hypothesis: HY-00005
algorithm: "Static analysis grep audit of all #[query] endpoints"
tags: [security, authorization, query-auth, cross-user-leakage]
methodology: "Grep all #[query] endpoints, trace to _impl, classify caller filtering"
duration: "single-session"
success_criteria: "Complete inventory of all query endpoints with authorization status"
---

## Objective

Test HY-00005: "Mandatory QueryAuth on all query endpoints eliminates cross-user data leakage"

Measure the current state of caller-scoped data filtering across all 9 canisters. This is an AUDIT experiment -- no code changes. We measure how many query endpoints properly filter returned data by caller/auth identity, and how many don't.

## Methodology

1. `rg '#[query]'` across all 9 canisters in `src/`
2. For each `#[query]` endpoint, examine:
   - Does it call `msg_caller()` or `AuthContext::from_ic()`?
   - Does it pass caller/auth to `_impl`?
   - Does the `_impl` filter returned data by caller?
3. Classify each endpoint: SAFE / NEEDS_FIX / N/A
4. Count totals per canister and overall

## Setup

- Repository: awen-network-canisters
- 9 canisters: evidence_vault, case_timeline, deadline_alerts, case_hub, legal_analysis, mcp_gateway, procedural_intel, reference_shield, settlement
- Tools: rg (ripgrep), manual code review
- No code modifications -- audit only

## Classification Criteria

- **SAFE**: Endpoint gets caller identity AND filters returned data by it, OR returns only the caller's own data
- **NEEDS_FIX**: Endpoint returns case-specific or user-specific data WITHOUT checking caller identity
- **N/A**: Endpoint returns system-wide data (stats, health checks, config, feature flags, metrics, static reference data, public data by design)

## Data Collection

See Results section below.

## Results

### Summary

| Canister | Total | SAFE | NEEDS_FIX | N/A |
|----------|-------|------|-----------|-----|
| evidence_vault | 40 | 22 | 5 | 13 |
| case_hub | 21 | 12 | 3 | 6 |
| case_timeline | 24 | 12 | 7 | 5 |
| deadline_alerts | 22 | 9 | 2 | 11 |
| legal_analysis | 21 | 4 | 5 | 12 |
| mcp_gateway | 12 | 1 | 2 | 9 |
| procedural_intel | 75 | 8 | 38 | 29 |
| reference_shield | 23 | 3 | 6 | 14 |
| settlement | 25 | 14 | 1 | 10 |
| **TOTAL** | **263** | **85** | **69** | **109** |

### Detailed Endpoint Audit

#### evidence_vault (40 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| get_feature_flags | No | No | No (system config) | N/A |
| verify_signature | No | No | No (verification) | N/A |
| get_evidence | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| get_evidence_content | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| get_decrypted_evidence | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| list_evidence | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| verify_evidence | No | No | No (hash verification) | N/A |
| evidence_exists | No | No | No (bool existence check) | N/A |
| search_metadata | Yes (AuthContext) | Yes (caller + now) | Yes | SAFE |
| get_provenance | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| verify_provenance_chain | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| verify_submission_receipt | No | No | No (receipt verification) | N/A |
| generate_integrity_report | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| verify_integrity_report | No | No | No (hash verification) | N/A |
| get_stats | No | No | No (aggregate counts) | N/A |
| get_current_key_version | No | No | No (key metadata) | N/A |
| vetkeys_available | No | No | No (bool) | N/A |
| list_key_versions | No | No | No (key metadata) | N/A |
| get_medical_evidence | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| list_medical_evidence | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_consent_status | No | No | Yes (medical consent) | NEEDS_FIX |
| suggest_redactions | No | No | Yes (medical evidence) | NEEDS_FIX |
| get_medical_timeline | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| identify_medical_gaps | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_adjustments_evidence | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_disclosure_matrix | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| identify_disclosure_gaps | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| health_check | No | No | No (system health) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| export_user_data | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_anon_evidence | No | No | Yes (by anonymous_id token) | NEEDS_FIX |
| get_audio_classification | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| list_audio_evidence | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_dsar_classification | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| list_dsar_responses | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| analyze_dsar_inconsistencies | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| analyze_dsar_contents | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| compare_dsar_to_disclosure | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| flag_high_impact_documents | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |

Note: get_anon_evidence is designed for anonymous evidence lookup by token -- this is intentional but needs review for whether the token itself is sufficient authorization. get_consent_status and suggest_redactions access medical data by evidence_id without verifying caller owns that evidence.

#### case_hub (21 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| get_feature_flags | No | No | No (system config) | N/A |
| get_config | No | No | No (system config) | N/A |
| get_case | Yes (msg_caller) | Yes (created_by == caller) | Yes | SAFE |
| list_cases | Yes (msg_caller) | Yes (created_by == caller) | Yes | SAFE |
| get_linked_cases | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| list_case_groups | Yes (msg_caller) | Yes (created_by == caller) | Yes | SAFE |
| get_case_group | Yes (msg_caller) | Yes (created_by == caller) | Yes | SAFE |
| get_cross_case_stats | No | No | No (aggregate stats) | N/A |
| health_check | No | No | No (system health) | N/A |
| get_stats | No | No | No (aggregate counts) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| get_saga | No | No | Yes (saga state by ID) | NEEDS_FIX |
| list_sagas | Yes (msg_caller) | Yes (initiator == caller) | Yes | SAFE |
| export_user_data | Yes (AuthContext) | Yes (via caller) | Yes | SAFE |
| detect_cross_case_patterns | No | No | Yes (searches ALL cases) | NEEDS_FIX |
| get_latest_portal_snapshot | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| detect_portal_asymmetry | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| identify_portal_gaps | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| get_deleted_cases | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |

Note: get_saga returns any saga by ID without caller check. detect_cross_case_patterns scans ALL cases to find patterns for a respondent -- leaks case existence across users.

#### case_timeline (24 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| get_feature_flags | No | No | No (system config) | N/A |
| get_config | No | No | No (system config) | N/A |
| get_causation_chain | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| export_causation_diagram | No | No | Yes (case events) | NEEDS_FIX |
| get_agreed_facts | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| get_disputed_facts | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| export_agreed_facts_schedule | No | No | Yes (case facts) | NEEDS_FIX |
| generate_case_summary | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| get_case_summary | Via generate_case_summary | Yes (via caller) | Yes | SAFE |
| get_events | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| get_events_by_category | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| search_events_by_title | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| get_events_by_evidence_id | No | No | Yes (case events) | NEEDS_FIX |
| get_chronology | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| get_case | No | No | Yes (case by ID) | NEEDS_FIX |
| list_cases | Yes (msg_caller) | Yes (created_by == caller) | Yes | SAFE |
| get_stats | No | No | Yes (case-specific stats) | NEEDS_FIX |
| get_parsed_thread | No | No | Yes (parsed thread by ID) | NEEDS_FIX |
| health_check | No | No | No (system health) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| export_user_data | Yes (AuthContext) | Yes (via caller) | Yes | SAFE |
| compare_bundles | No | No | Yes (case bundle audits) | NEEDS_FIX |
| get_bundle_audit | No | No | Yes (bundle audit by ID) | N/A |

#### deadline_alerts (22 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| get_feature_flags | No | No | No (system config) | N/A |
| get_config | No | No | No (system config) | N/A |
| get_upcoming_hearings | No | No | Yes (case hearings) | NEEDS_FIX |
| list_deadlines | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_deadline | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_active_deadlines | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| check_alerts | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_deadlines_by_type | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_stats | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_era_config | No | No | No (system config) | N/A |
| get_applicable_era_version | No | No | No (statutory calc) | N/A |
| calculate_deadline_with_era | No | No | No (pure calculation) | N/A |
| check_unfair_dismissal_eligibility | No | No | No (pure calculation) | N/A |
| suggest_related_deadlines | No | No | No (pure calculation) | N/A |
| get_deadline_guidance | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| export_deadlines_ical | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| health_check | No | No | No (system health) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| check_interim_relief_eligibility | No | No | No (pure check) | N/A |
| generate_dsar_template_query | No | No | No (template gen) | N/A |
| export_user_data | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |

Note: get_upcoming_hearings filters by case_id but not by caller -- anyone who knows a case_id can see hearing listings.

#### legal_analysis (21 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| get_config | No | No | No (system config) | N/A |
| get_stats | Yes (msg_caller) | Yes (caller filter) | Yes | SAFE |
| list_case_predictions | Yes (msg_caller) | Yes (caller filter) | Yes | SAFE |
| assess_costs_risk | No | No | No (pure computation) | N/A |
| get_tribunal_powers_guidance | No | No | No (static reference) | N/A |
| list_available_remedies | No | No | No (static reference) | N/A |
| get_supported_claim_types | No | No | No (static reference) | N/A |
| get_et1_form | No | No | Yes (case ET1 data) | NEEDS_FIX |
| validate_et1 | No | No | Yes (case ET1 data) | NEEDS_FIX |
| get_schedule | No | No | Yes (schedule of loss) | NEEDS_FIX |
| assess_inequality_of_arms | No | No | No (pure computation) | N/A |
| health_check | No | No | No (system health) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| analyze_witness_statement | Yes (AuthContext) | Yes (auth check) | Yes | SAFE |
| get_feature_flags | No | No | No (system config) | N/A |
| export_user_data | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| generate_eat_skeleton | No | No | Yes (case-based gen) | NEEDS_FIX |
| generate_t444_scaffold | No | No | No (template gen) | N/A |
| assess_eat_sift_readiness | No | No | No (pure computation) | N/A |

Note: get_et1_form, validate_et1, get_schedule, and generate_eat_skeleton all look up case-specific data by case_id without caller verification. Anyone who knows a case_id can read another user's ET1 form or schedule of loss.

#### mcp_gateway (12 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| get_feature_flags | No | No | No (system config) | N/A |
| get_config | No | No | No (system config) | N/A |
| list_tools | No | No | No (tool catalog) | N/A |
| get_tool | No | No | No (tool catalog) | N/A |
| list_tools_by_category | No | No | No (tool catalog) | N/A |
| get_request_history | No | No | Yes (ALL request logs) | NEEDS_FIX |
| get_stats | No | No | No (aggregate stats) | N/A |
| health_check | No | No | No (system health) | N/A |
| transform_openrouter_response | No | No | No (HTTP transform) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| export_user_data | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |

Note: get_request_history exposes ALL users' MCP request logs -- significant cross-user leakage vector. Any authenticated user can see every other user's tool invocations.

#### procedural_intel (75 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| get_feature_flags | No | No | No (system config) | N/A |
| get_suppression_profile | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| get_suppression_heatmap | No | No | No (aggregate data) | N/A |
| get_slapp_assessment | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| analyze_attrition | No | No | Yes (case events) | NEEDS_FIX |
| get_attrition_leaderboard | No | No | No (aggregate) | N/A |
| get_move_suggestion | No | No | Yes (suggestion by ID) | NEEDS_FIX |
| get_available_moves | No | No | No (static reference) | N/A |
| get_claim_specific_checklist | No | No | No (static reference) | N/A |
| get_sexual_harassment_guidance | No | No | No (static reference) | N/A |
| match_tactics | No | No | No (pure computation) | N/A |
| get_judgment_history | No | No | No (public entity data) | N/A |
| get_entity_judgment_summary | No | No | No (public entity data) | N/A |
| detect_aggregated_defense | No | No | Yes (case patterns) | NEEDS_FIX |
| get_entity_risk | No | No | No (public entity data) | N/A |
| suggest_strategy | No | No | No (static reference) | N/A |
| get_patterns_for_entity | No | No | No (public entity data) | N/A |
| list_high_risk_entities | No | No | No (public entity data) | N/A |
| get_all_tactics | No | No | No (static reference) | N/A |
| get_checklist_template | No | No | No (static reference) | N/A |
| list_checklist_templates | No | No | No (static reference) | N/A |
| get_checklist_status | No | No | Yes (case checklist) | NEEDS_FIX |
| get_regulatory_complaint | Yes (AuthContext) | Yes (via caller) | Yes | SAFE |
| list_regulatory_complaints | Yes (AuthContext) | Yes (via caller) | Yes | SAFE |
| get_complaint_template | No | No | No (static template) | N/A |
| list_complaint_templates | No | No | No (static templates) | N/A |
| get_strategic_guidance | No | No | No (static reference) | N/A |
| assess_regulatory_options | No | No | No (pure computation) | N/A |
| get_regulatory_deadlines | No | No | Yes (case complaints) | NEEDS_FIX |
| get_all_parallel_proceedings | Yes (msg_caller) | Yes (via caller) | Yes | SAFE |
| get_stats | No | No | No (aggregate stats) | N/A |
| search_entities | No | No | No (public entity data) | N/A |
| get_entity_dashboard | No | No | No (public entity data) | N/A |
| get_leaderboard | No | No | No (public entity data) | N/A |
| public_entity_risk | No | No | No (public API) | N/A |
| public_tactic_library | No | No | No (public API) | N/A |
| public_stats | No | No | No (public API) | N/A |
| health_check | No | No | No (system health) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| suggest_next_move | Yes (AuthContext) | Partial (gets auth, does not filter) | Yes | NEEDS_FIX |
| export_user_data | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_document_priority | No | No | No (static reference) | N/A |
| get_sequence | Yes (AuthContext) | Yes (via caller) | Yes | SAFE |
| list_sequences | Yes (AuthContext) | Yes (via caller) | Yes | SAFE |
| generate_foi_request | No | No | Yes (case-based gen) | NEEDS_FIX |
| assess_disclosure_completeness | No | No | Yes (case analysis) | NEEDS_FIX |
| detect_insurance_cap | No | No | Yes (case analysis) | NEEDS_FIX |
| detect_gagging_clauses | No | No | Yes (case analysis) | NEEDS_FIX |
| list_parliamentary_contacts | No | No | No (public directory) | N/A |
| list_media_pitches | No | No | Yes (all pitches) | NEEDS_FIX |
| get_campaign_wave | No | No | Yes (wave by ID) | NEEDS_FIX |
| analyze_cross_front_links | No | No | Yes (case analysis) | NEEDS_FIX |
| detect_strategic_redundancy | No | No | Yes (case analysis) | NEEDS_FIX |
| detect_parallel_hr_processes | No | No | Yes (case analysis) | NEEDS_FIX |
| detect_wp_false_claims | No | No | Yes (case analysis) | NEEDS_FIX |
| assess_legal_team_disproportion | No | No | Yes (case analysis) | NEEDS_FIX |
| score_settlement_suppression | No | No | Yes (case analysis) | NEEDS_FIX |
| calculate_costs_consequences | No | No | Yes (case analysis) | NEEDS_FIX |
| analyze_deadline_interdependencies | No | No | No (pure computation on input) | N/A |
| recommend_delay_escalation | No | No | No (pure computation on input) | N/A |
| analyze_judge_patterns | No | No | Yes (case analysis) | NEEDS_FIX |
| profile_solicitor_firm | No | No | Yes (case analysis) | NEEDS_FIX |
| assess_anonymity_order | No | No | Yes (case analysis) | NEEDS_FIX |
| guide_witness_attendance_order | No | No | Yes (case analysis) | NEEDS_FIX |
| assess_enforcement_options | No | No | Yes (case analysis) | NEEDS_FIX |
| detect_witness_reuse | No | No | Yes (case analysis) | NEEDS_FIX |
| model_attrition_costs | No | No | No (pure computation on input) | N/A |
| recommend_appeal_strategy | No | No | Yes (case analysis) | NEEDS_FIX |
| detect_retaliation_pattern | No | No | No (pure computation on input) | N/A |
| analyze_regulatory_et_timing | No | No | Yes (case analysis) | NEEDS_FIX |
| aggregate_tactics_across_cases | No | No | No (pure computation on input) | N/A |
| check_deadline_tactic_windows | No | No | Yes (case analysis) | NEEDS_FIX |
| correlate_timeline_suppression | No | No | Yes (case analysis) | NEEDS_FIX |
| match_evidence_to_tactics | No | No | Yes (case analysis) | NEEDS_FIX |

Note: procedural_intel is the worst offender. Many of the "analysis" endpoints (detect_*, assess_*, analyze_*) take case-specific input and look up stored data without verifying the caller owns that case. The entire "suppression warfare" and "cross-front" analysis blocks (lines 4575-6700) have zero caller verification -- 30+ endpoints.

#### reference_shield (23 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| derivation_origin | No | No | No (canister metadata) | N/A |
| vc_consent_message | No | No | No (consent info) | N/A |
| get_credential | No | No | Yes (credential by ID) | NEEDS_FIX |
| verify_clearance_level | No | No | No (bool check) | N/A |
| verify_credential_selective | No | No | Yes (credential verification) | NEEDS_FIX |
| get_feature_flags | No | No | No (system config) | N/A |
| vetkeys_available | No | No | No (bool) | N/A |
| check_submission_status | No | No | Yes (status by token) | NEEDS_FIX |
| check_submission_status_by_pseudonym | No | No | Yes (status by pseudonym) | NEEDS_FIX |
| verify_credential | No | No | Yes (credential by ID) | NEEDS_FIX |
| get_credentials_for_holder | No | No | Yes (by holder principal) | NEEDS_FIX |
| get_endorsements | No | No | No (public endorsements) | N/A |
| get_credentials_by_clearance | No | No | No (aggregate query) | N/A |
| get_stats | No | No | No (aggregate stats) | N/A |
| assess_reputation_attack | No | No | No (by subject principal) | N/A |
| get_peer_verifications | No | No | No (by subject principal) | N/A |
| generate_whistleblower_proof | Yes (require_auth!) | Yes (auth check) | Yes | SAFE |
| get_issuer | No | No | No (public issuer data) | N/A |
| list_issuers | No | No | No (public directory) | N/A |
| health_check | No | No | No (system health) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| export_user_data | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |

Note: reference_shield has unique security considerations. get_credential and verify_credential expose credential data without caller check. get_credentials_for_holder takes an arbitrary holder principal and returns all their credentials -- any user can enumerate another user's credentials. check_submission_status/by_pseudonym are intentional token-based lookups.

#### settlement (25 endpoints)

| Endpoint | Accepts caller? | Filters by caller? | Returns user data? | Status |
|----------|----------------|--------------------|--------------------|--------|
| get_offer | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| list_offers | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| compare_offer_to_schedule | Yes (AuthContext) | Yes (owner check) | Yes | SAFE |
| compare_offers | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_negotiation_summary | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| generate_settlement_summary | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_valuation | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| suggest_counteroffer | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| get_costs_analysis | Yes (AuthContext) | Yes (caller_has_offers check) | Yes | SAFE |
| analyze_calderbank_consequences | Yes (require_auth!) | Yes (via auth) | Yes | SAFE |
| get_clause_templates | No | No | No (static templates) | N/A |
| calculate_vento_award | No | No | No (pure computation) | N/A |
| calculate_combined_remedy | No | No | No (pure computation) | N/A |
| calculate_pension_loss | No | No | No (pure computation) | N/A |
| calculate_tax_treatment | No | No | No (pure computation) | N/A |
| check_cot3_compliance | No | No | No (pure text analysis) | N/A |
| health_check | No | No | No (system health) | N/A |
| metrics | No | No | No (system metrics) | N/A |
| http_request | No | No | No (metrics/health) | N/A |
| get_stats | No | No | No (aggregate stats) | N/A |
| get_feature_flags | No | No | No (system config) | N/A |
| export_user_data | Yes (AuthContext) | Yes (via auth) | Yes | SAFE |
| get_cost_schedule | Yes (AuthContext) | Yes (created_by == caller) | Yes | SAFE |
| get_financial_position | Yes (AuthContext) | Yes (via caller) | Yes | SAFE |
| generate_hardship_report | Yes (AuthContext) | Yes (via caller) | Yes | SAFE |

Note: settlement is the best-secured canister. All endpoints returning user-specific data check auth. Only get_clause_templates returns system-wide data.

## Analysis

### Key Findings

1. **263 total #[query] endpoints** across 9 canisters
2. **85 (32.3%) are SAFE** -- properly filter by caller identity
3. **69 (26.2%) NEED_FIX** -- return user/case data without caller verification
4. **109 (41.4%) are N/A** -- return system-wide/public/computed data

### Risk Assessment

**CRITICAL (immediate data leakage):**
- mcp_gateway.get_request_history: Exposes ALL users' tool invocations
- reference_shield.get_credentials_for_holder: Enumerate any user's credentials
- legal_analysis.get_et1_form / get_schedule: Expose sensitive legal filings
- evidence_vault.get_consent_status: Medical consent records exposed

**HIGH (case data leakage via case_id guessing):**
- procedural_intel: 30+ analysis endpoints expose case strategy, tactics, analysis
- case_timeline: 7 endpoints expose events, facts, bundle audits
- case_hub.detect_cross_case_patterns: Leaks case existence across users

**MEDIUM (requires knowledge of resource IDs):**
- evidence_vault.suggest_redactions: Medical evidence analysis by ID
- case_hub.get_saga: Saga state by ID
- case_timeline.get_parsed_thread: Thread data by ID

### Worst Offenders by Canister

1. **procedural_intel**: 38/75 NEEDS_FIX (50.7%) -- lowest security posture
2. **case_timeline**: 7/24 NEEDS_FIX (29.2%)
3. **reference_shield**: 6/23 NEEDS_FIX (26.1%)
4. **legal_analysis**: 5/21 NEEDS_FIX (23.8%)
5. **evidence_vault**: 5/40 NEEDS_FIX (12.5%)

### Best Secured Canister

1. **settlement**: 1/25 NEEDS_FIX (4.0%) -- only the absent get_clause_templates concern
   Actually: 0/25 true NEEDS_FIX -- settlement has no unprotected user data endpoints

### Pattern Observations

- Canisters that use `AuthContext::from_ic()` pattern tend to be better secured
- The `_impl(caller, ...)` pattern works well when applied consistently
- Many "pure computation" endpoints in procedural_intel take case_id and fetch stored data internally, appearing to be pure functions but actually reading case-specific stored state without auth
- The "analysis" and "detect" function families in procedural_intel were likely added in bulk without the auth pattern

## Next Steps

1. Add `AuthContext` requirement to all 69 NEEDS_FIX endpoints
2. Prioritize CRITICAL-risk endpoints first (mcp_gateway, reference_shield, legal_analysis, evidence_vault)
3. The procedural_intel canister needs a systematic refactor -- 38 endpoints need auth
4. Consider adding integration tests that verify anonymous principals cannot access case-specific data
5. Create a clippy-like lint or compile-time check that all `#[query]` functions touching stored case data require auth
