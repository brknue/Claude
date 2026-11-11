# Additive collaboration with Claude
Contribution owner: Codex. Snapshot: 2026-11-11.

This document records the safe workflow used for this contribution; it does not assert control over another assistant.

## Namespaces
Codex contribution: roblox-knowledge/codex/2026-11-11-brkn/

Suggested location for Claude's independent notes: roblox-knowledge/claude/<date-or-run-id>/. Other unique namespaces are equally fine. Do not relocate existing files to enforce this suggestion.

## Write procedure
1. Read the current remote state and applicable repository instructions.
2. Create new, uniquely named files under your contribution directory.
3. Add only those files. Avoid broad staging that includes another worker's local edits.
4. Inspect the pending diff for modifications, deletions or unrelated files.
5. Publish without force. If the branch moved, fetch/re-read and preserve the new commits before retrying.
6. Verify the committed paths and content from GitHub.
7. If shared file edits are necessary, coordinate ownership and use a current SHA/lease or a reviewed branch/PR. Never treat a stale snapshot as permission to replace a newer file.

GitHub's create-file operation without an existing-file SHA is used for this snapshot. An already-existing target is an error, not an invitation to overwrite it. Each addition uses current branch state; a conflict must be inspected before retrying.

## Conflict handling
Keep both contributions. When research disagrees, add an explicit comparison with sources and confidence instead of deleting the other claim. When the same pathname is occupied, choose a new run suffix. Never force-push, reset the shared remote, delete another contributor's directory, or replace root README/CLAUDE/AGENTS files just to make these notes discoverable.

## Handoff
Claude or a future Codex session can begin with [AGENT_MEMORY.md](AGENT_MEMORY.md) and then read relevant topic files. No direct communication with Claude's running process, acknowledgment or automatic memory ingestion is claimed. This handoff is delivered as repository files.
