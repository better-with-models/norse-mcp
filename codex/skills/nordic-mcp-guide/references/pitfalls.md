# nordic-mcp Common Pitfalls

## P1: Skill installed but not visible

Restart Codex after installing the skill. Codex does not pick up new skills in
an already-running session.

## P2: Stack not running

All `nordic_*` calls fail if the Docker stack is not healthy.

## P3: Missing or wrong API key

Confirm `OPENVIKING_ROOT_API_KEY` and `OPENAI_API_KEY` are set in
`container/.env`, then restart the stack.

## P4: Port 1933 already in use

Free the port or remap it deliberately and update the MCP config example to
match the running endpoint.

## P5: Search returns poor results

Try `nordic_hybrid_search`, confirm the collection is not empty, and verify the
embedding configuration has not changed after ingestion.

