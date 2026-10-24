# Debounced Search Race — Working Demo

This project demonstrates and fixes a classic search-as-you-type race:

- typing is debounced by 250 ms;
- a new request aborts the previous `fetch`;
- every request gets a monotonically increasing ID;
- an old response is ignored even if it manages to finish;
- tests deterministically force responses to arrive out of order.

## Requirements

Node.js 18+ is recommended.

## Run

```bash
npm test
npm start
```

Then open:

http://localhost:3000

## Reproduce the race

Type quickly, for example:

```text
a
ab
abc
```

The server intentionally gives shorter queries longer delays. The correct implementation always leaves the UI showing results for the latest query.

## What the tests verify

1. A later response cannot be overwritten by an older response.
2. The previous request's `AbortSignal` is actually aborted.
3. Correct TypeScript-style response shapes do not by themselves prevent the semantic race.

## Suggested exercise

To see the bug, temporarily remove the request-ID guard and/or the `AbortController` logic in `app.js`, then run the tests and browser demo again.
