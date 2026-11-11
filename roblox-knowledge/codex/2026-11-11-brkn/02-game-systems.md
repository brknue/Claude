# Secure gameplay, persistence and economy

## Authority and network contracts — documented
RemoteEvents provide asynchronous one-way communication; RemoteFunctions wait for a reply. UnreliableRemoteEvents trade delivery/ordering guarantees for suitable transient traffic. The server should decide meaningful outcomes; clients send intent and render feedback. [Remote communication, S03](https://create.roblox.com/docs/scripting/events/remote).

Validate types, sizes, finite numeric values, ranges, ownership, permissions and current gameplay context on the server. Never accept a client-provided price, damage amount or reward as authoritative. Put rate limits on the server, including logic reached through prompts or touches. [Security boundary, S04](https://create.roblox.com/docs/scripting/security/client-server-boundary).

Recommended contract example:
```text
Client intent: BuyUpgrade(upgradeId)
Server:
  check payload shape and request rate
  obtain loaded player state
  resolve allowed upgrade and server-owned price
  check prerequisites and balance
  apply spend + grant as one non-yielding in-memory decision
  queue persistence using the game's chosen consistency design
  send authoritative result and updated display state
```
This is pseudocode, not a ready persistence/transaction implementation. If any operation yields, guard against re-entry and concurrent mutation.

## Common gameplay systems — recommended designs
| System | Authoritative state | Client responsibility | Failure to test |
|---|---|---|---|
| Round game | Phase, participants, score, deadlines | Countdown and HUD | Late join, disconnect, zero players |
| Combat | Equipped tool, cooldown, hit validation, damage | Input, animation and prediction | Out-of-range hit, replayed request |
| Collectible | Availability and awarded player | Visual feedback | Simultaneous touches |
| Inventory | Item IDs, counts, ownership | Selection and item display | Duplicate equip or negative count |
| Quest | Objective progress and claim state | Goal text and navigation | Claim requested twice |
| Tycoon | Ownership, funds, unlock prerequisites | Preview and controls | Two players buy same plot |

Prefer explicit state transitions. Keep balance configuration separate from implementation. A client animation completing is not proof that a server reward is due.

## Persistent data — documented
DataStoreService persists across sessions and places in a game, and is accessed from server scripts. Calls can fail; handle errors. UpdateAsync addresses competing updates and its callback cannot yield; it does not automatically make an entire gameplay economy transactional. Studio API access can touch live stores, so use a separate test game. [Data stores, S05](https://create.roblox.com/docs/cloud-services/data-stores).

Recommended lifecycle, informed by [official datastore best practices, S27](https://create.roblox.com/docs/cloud-services/data-stores/best-practices):
1. Load and validate a versioned player record.
2. Distinguish successful absence from a failed request.
3. Keep failure state from becoming a default record that overwrites real progress.
4. Define ownership/session coordination, autosave cadence and bounded retry policy.
5. Serialize mutations consistently; use idempotent operation identifiers where replay is possible.
6. Flush on leave/shutdown as a best effort, with diagnostics and a recovery plan.

Official guidance also favors a small set of stores, stable UserId-based keys, co-locating data that must change atomically, in-memory buffering, staggered saves and bounded backoff/jitter. It labels DataStore2 a legacy library unsuitable for new experiences; old videos recommending it need that correction. [S27](https://create.roblox.com/docs/cloud-services/data-stores/best-practices).

These are design requirements to implement and test, not a supplied production datastore module. Record migration rules and old-version behavior before shipping new fields.

## Purchases — documented
Developer products are repeatable purchases; passes cover one-time privileges. Process developer-product grants through ProcessReceipt, not PromptProductPurchaseFinished. A closed prompt is not proof of purchase. [S06](https://create.roblox.com/docs/production/monetization/developer-products).

Recommendation: use a durable receipt identifier and a grant process that survives retries, disconnects and saves failing. Prove the purchased value is durable before acknowledging delivery. A receipt record and its grant must not drift apart after a crash. Check the current [MarketplaceService receipt reference, S28](https://create.roblox.com/docs/reference/engine/classes/MarketplaceService#ProcessReceipt) before implementing. The same reference marks GetProductInfo deprecated in favor of GetProductInfoAsync, illustrating why older tutorial calls need checking. Do not copy a short demonstration handler into a live economy without analyzing those windows.

Paid random items, including indirect paid-currency purchases, require outcome/odds disclosures and per-player policy handling. Recheck ArePaidRandomItemsRestricted and IsPaidItemTradingAllowed behavior before enabling those systems. [S07](https://create.roblox.com/docs/production/monetization/paid-random-items).
