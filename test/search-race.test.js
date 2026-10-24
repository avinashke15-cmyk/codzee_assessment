import test from "node:test";
import assert from "node:assert/strict";

function createSearchEnvironment() {
  let currentRequestId = 0;
  let controller = null;
  let rendered = null;

  const pending = [];

  globalThis.fetch = (url, options = {}) => {
    const request = {
      url,
      signal: options.signal,
      resolve: null,
      reject: null
    };

    const promise = new Promise((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
    });

    pending.push(request);
    return promise;
  };

  async function search(query) {
    const id = ++currentRequestId;

    controller?.abort();
    controller = new AbortController();
    const localController = controller;

    try {
      const response = await fetch(`/api/search?q=${query}`, {
        signal: localController.signal
      });

      const data = await response.json();

      if (id !== currentRequestId) {
        return;
      }

      rendered = data.results;
    } catch (error) {
      if (error.name === "AbortError") return;
      throw error;
    }
  }

  return {
    search,
    pending,
    get rendered() {
      return rendered;
    }
  };
}

function response(results) {
  return {
    ok: true,
    async json() {
      return { results };
    }
  };
}

test("latest response wins even when responses arrive out of order", async () => {
  const env = createSearchEnvironment();

  const first = env.search("a");
  const firstRequest = env.pending[0];

  const second = env.search("ab");
  const secondRequest = env.pending[1];

  // The newer request finishes first.
  secondRequest.resolve(response(["AB result"]));
  await second;

  // The older request finishes later.
  firstRequest.resolve(response(["A result"]));
  await first;

  assert.deepEqual(env.rendered, ["AB result"]);
});

test("starting a new search aborts the previous request", async () => {
  const env = createSearchEnvironment();

  env.search("a");
  const firstRequest = env.pending[0];

  env.search("ab");

  assert.equal(firstRequest.signal.aborted, true);
});

test("response and request types can be correct while the race is still possible", () => {
  // This test documents the semantic nature of the bug:
  // both responses have the same valid shape; the important question is
  // whether the response belongs to the latest request.
  const oldResponse = { results: ["old"] };
  const newResponse = { results: ["new"] };

  assert.ok(Array.isArray(oldResponse.results));
  assert.ok(Array.isArray(newResponse.results));
});
