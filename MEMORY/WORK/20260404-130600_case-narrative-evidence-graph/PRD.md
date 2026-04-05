---
task: Case Narrative Evidence Graph with Cross-Canister Traversal
slug: 20260404-130600_case-narrative-evidence-graph
effort: large
phase: complete
progress: 0/8
mode: dev-job
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:00:00Z
ladder_refs: [ID-00038, HY-00020]
domain: legal-strategy
canisters: [case_hub, evidence_vault, case_timeline, legal_analysis, procedural_intel]
---

## Context

A litigation case is a web of interconnected facts. An event leads to a document. That document contradicts a claim in the GoR. The GoR claim is rebutted by a transcript quote. The transcript quote came from a hearing where a witness said something that contradicts their own witness statement. Every piece connects to others.

Currently, these connections exist only in the litigant's head or in scattered notes. The Awen Network stores events, evidence, claims, and rebuttals in separate canisters, but there is no way to traverse the connections between them. You cannot ask "show me everything connected to the dismissal meeting on 15 March" and get back the meeting notes, the GoR paragraph that describes it differently, the transcript where the manager contradicted themselves, and the witness statement that supports the claimant's version.

This PRD builds a bidirectional evidence graph. Nodes are the entities already stored across canisters (events, evidence, claims, rebuttals, transcript quotes, witness statements). Edges define relationships (supports, contradicts, refines, extends, temporal_causation). The graph is queryable: given any node, find all connected nodes. Given two nodes, find the path between them. Given a root node, extract a subgraph to a specified depth.

The goal is "one question away from any answer" -- the litigant should be able to start from any fact and traverse to all related material.

ID-00038 identified this as the missing connective tissue. HY-00020 hypothesized that a traversable evidence graph would transform case preparation from linear document review to connected exploration.

## Scope

1. Define node and edge type enums in `awen_types`
2. Implement edge storage in `case_hub` (the coordinator canister)
3. Build bidirectional traversal queries
4. Implement cross-canister graph queries (case_hub coordinates, other canisters provide node data)
5. Build path discovery and subgraph extraction
6. Enforce node count limits per case to prevent unbounded growth
7. Integration test modeling the Bylor Para 22 contradiction chain

## Acceptance Criteria

- [ ] ISC-1: GraphNode enum defined with variants: Event (case_timeline), Evidence (evidence_vault), Claim (legal_analysis), Rebuttal (legal_analysis), TranscriptQuote (evidence_vault), WitnessStatement (evidence_vault) -- each variant carries the canister-specific ID
- [ ] ISC-2: GraphEdge enum defined with variants: Supports, Contradicts, Refines, Extends, TemporalCausation -- each edge is stored with source_node, target_node, edge_type, confidence (f32 0.0-1.0), created_by (Principal), rationale (String)
- [ ] ISC-3: Bidirectional traversal: given any GraphNode, find all connected nodes by edge type -- get_connected(node, edge_type_filter) returns Vec of (GraphNode, GraphEdge) pairs in both directions
- [ ] ISC-4: Cross-canister query: case_hub coordinates graph queries by dispatching to the appropriate canister for node data enrichment -- a traversal result includes the full node data, not just IDs
- [ ] ISC-5: Path discovery: find_path(node_a, node_b, max_depth) returns the shortest connecting chain of nodes and edges, or None if no path exists within max_depth (default 6, maximum 10)
- [ ] ISC-6: Subgraph extraction: get_subgraph(root_node, depth) returns all nodes and edges reachable within the specified depth from the root, as a self-contained graph structure
- [ ] ISC-7: Node count limits enforced per case: maximum 10,000 nodes and 50,000 edges per case, with clear error when limits are reached
- [ ] ISC-8: Integration test modeling the Bylor Para 22 chain: Event (dismissal meeting) -> Evidence (meeting notes) -> Claim (GoR para 22) -> Rebuttal (contradicting evidence) -> TranscriptQuote (manager's hearing statement) -- verify full traversal and path discovery

## Dependencies

- PRD 6 (Audio Transcript Domain Types): TranscriptQuote node type requires the QuoteExtract type from PRD 6
- PRD 5 (GoR Rebuttal Tracker): Rebuttal node type requires the StoredRebuttal type from PRD 5
- Note: The graph infrastructure (node/edge enums, storage, traversal) can be built before PRD 5 and 6 are complete, using stub node types. Full integration requires both.

## Evidence

- **ID-00038**: Gap analysis identified that Awen Network stores individual evidence types well but has no connective layer -- a litigant cannot traverse from one fact to related facts without manual lookup
- **HY-00020**: Hypothesis that a traversable evidence graph would reduce case preparation time by enabling connected exploration rather than linear document review -- initial estimate: 40% reduction in time spent locating related material

## Out of Scope

- Graph visualization / UI rendering -- this PRD covers the data layer and query API only
- Automatic edge creation -- all edges are created explicitly by the user or by other features (e.g., contradiction detection creates "contradicts" edges)
- Graph analytics (centrality, clustering) -- future enhancement
- Cross-case graph queries -- each graph is scoped to a single case
- Natural language graph queries ("show me everything about the dismissal") -- future AI layer
