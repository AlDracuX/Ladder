---
id: AL-00006
title: "LazyEntry iterator pattern for StableBTreeMap 0.7"
status: complete
created: 2026-03-22
domain: "icp-canister-development"
tags: [rust, icp, canister, stable-storage, iterator, lazy-evaluation]
experiments: []
complexity: low
---

## Description

In `ic-stable-structures` 0.7.x, `StableBTreeMap::iter()` returns `LazyEntry` items instead of `(K, V)` tuples. Keys and values are accessed via `.key()` and `.value()` methods that lazily deserialize from stable memory. Keys are returned by reference and often need dereferencing with `*entry.key()` for Copy types like `u64`.

## Method

### Basic Iterator Pattern

The `iter()` method returns an iterator of `LazyEntry` items. Access key and value through methods, not tuple destructuring:

```rust
// Correct (0.7.x): use .key() and .value() methods
EVIDENCE_STORE.with(|store| {
    store.borrow().iter()
        .filter(|entry| entry.value().owner == caller)
        .map(|entry| entry.value().into())
        .collect()
})
```

### Key Dereferencing

For `Copy` key types (u64, u32, etc.), `.key()` returns a reference. Dereference with `*`:

```rust
// Collect all evidence IDs (key is u64)
let evidence_ids: Vec<u64> = EVIDENCE_STORE.with(|store| {
    store.borrow().iter()
        .map(|entry| *entry.key())
        .collect()
});
```

### Combined Key and Value Access

When you need both key and value in a filter/map chain:

```rust
// Filter by value, extract key
fn list_evidence_impl(case_id: Option<String>, auth: &AuthContext) -> Vec<Evidence> {
    let caller = auth.caller;
    let now = auth.now;
    EVIDENCE_STORE.with(|store| {
        store.borrow().iter()
            .filter(|entry| {
                let id = entry.key();      // &u64
                let e = entry.value();     // StoredEvidence (deserialized)
                let has_permission = e.owner == caller || has_access_at(*id, caller, now);
                let matches_case = case_id.as_ref().is_none_or(|cid| e.case_id.as_ref() == Some(cid));
                has_permission && matches_case
            })
            .map(|entry| entry.value().into())
            .collect()
    })
}
```

### Counting with Filter

The quota enforcement pattern uses `filter().count()` on LazyEntry iterators:

```rust
let user_count = EVIDENCE_STORE.with(|store| {
    store.borrow().iter()
        .filter(|entry| entry.value().owner == caller)
        .count()
});
```

### Composite Keys

For tuple keys like `(u64, u64)` in custody logs:

```rust
// CUSTODY_LOG key is (evidence_id, sequence_number)
CUSTODY_LOG.with(|log| {
    let log = log.borrow();
    log.range((evidence_id, 0u64)..=(evidence_id, u64::MAX))
        .map(|entry| entry.value().into())
        .collect()
})
```

### String Key Cloning

For non-Copy key types like `String`, use `.clone()`:

```rust
let expired_keys: Vec<String> = store.iter()
    .take(batch_size)
    .filter(|entry| entry.value().expires_at <= current_time)
    .map(|entry| entry.key().clone())
    .collect();
```

### Converting to Output Types

The common pattern is `.map(|entry| entry.value().into())` where `Into<OutputType>` is implemented for the stored type, converting internal representation to API response types.

## When to Use

- Every time you iterate over a `StableBTreeMap` in ic-stable-structures 0.7.x.
- Replaces the 0.6.x pattern of `store.iter().map(|(k, v)| ...)` tuple destructuring.
- Used extensively for filtering, counting, collecting, and searching stable storage.

## Inputs

- **`StableBTreeMap<K, V, Memory>`**: The stable storage map to iterate.
- **Filter predicates**: Closures operating on `entry.key()` and `entry.value()`.

## Outputs

- **`entry.key()`**: Returns `&K` -- a reference to the deserialized key. For `Copy` types, dereference with `*`.
- **`entry.value()`**: Returns `V` -- a deserialized clone of the value from stable memory.
- Iterator chains produce `Vec<T>`, `usize` (count), `bool` (any), etc.

## Limitations

- **Deserialization cost**: Each `entry.value()` call deserializes from stable memory. If called multiple times on the same entry in a filter+map chain, the value is deserialized multiple times. For complex chains, consider collecting to a Vec first.
- **No tuple destructuring**: `for (k, v) in store.iter()` does not compile in 0.7.x. Must use `for entry in store.iter()` with method access.
- **Value is owned, key is borrowed**: `.value()` returns an owned `V` (deserialized copy). `.key()` returns `&K`. This asymmetry means you cannot hold both simultaneously without cloning or dereferencing the key first.
- **Full scan cost**: All patterns shown are O(n) full scans. For large stores (10K+ entries), consider secondary indexes (like `HASH_INDEX` in evidence_vault) for O(log n) lookups.
- **Instruction limits**: Iterating over very large stores may exceed IC instruction limits per call. Use `.take(limit)` to cap iteration depth for query methods (e.g., `MAX_QUERY_RESULTS = 500`).

## Evidence

- **evidence_vault/src/lib.rs** lines 2484-2499: `list_evidence_impl` showing `.filter()` with both `entry.key()` and `entry.value()` access, demonstrating the `*id` dereference pattern.
- **evidence_vault/src/lib.rs** line 3076: `store.borrow().iter().map(|entry| *entry.key()).collect()` -- collecting u64 keys with dereference.
- **evidence_vault/src/lib.rs** lines 1566-1571: `store.borrow().iter().filter(|entry| entry.value().owner == caller).count()` -- quota counting pattern.
- **evidence_vault/src/lib.rs** lines 3093-3097: `versions.borrow().iter().map(|entry| entry.value().into()).collect()` -- converting stored types to API types.
- **packages/awen_types/src/idempotency.rs** lines 119-124: `store.iter().take(batch_size).filter(...).map(|entry| entry.key().clone()).collect()` -- String key cloning pattern.
- **case_hub/src/lib.rs** lines 2181-2191: Composite filtering on `entry.value()` with `*entry.key()` collection for link deletion.
