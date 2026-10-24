const searchInput = document.querySelector("#search");
const resultsContainer = document.querySelector("#results");
const status = document.querySelector("#status");

let debounceTimer = null;
let controller = null;
let requestId = 0;

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();

  clearTimeout(debounceTimer);

  // Cancel the previous in-flight request.
  if (controller) {
    controller.abort();
    controller = null;
  }

  if (!query) {
    resultsContainer.replaceChildren();
    status.textContent = "";
    return;
  }

  status.textContent = "Waiting…";

  debounceTimer = setTimeout(() => {
    search(query);
  }, 250);
});

async function search(query) {
  const currentRequestId = ++requestId;

  controller = new AbortController();
  const localController = controller;

  status.textContent = `Searching for "${query}"…`;

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: localController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Important: cancellation is not enough by itself.
    // Never let an older response update the current UI.
    if (currentRequestId !== requestId) {
      return;
    }

    renderResults(data.results);
    status.textContent = `Results for "${data.query}"`;
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    if (currentRequestId === requestId) {
      status.textContent = "Search failed";
      console.error(error);
    }
  } finally {
    if (currentRequestId === requestId) {
      controller = null;
    }
  }
}

function renderResults(results) {
  resultsContainer.replaceChildren();

  if (results.length === 0) {
    resultsContainer.textContent = "No results";
    return;
  }

  for (const item of results) {
    const div = document.createElement("div");
    div.className = "result";

    const title = document.createElement("strong");
    title.textContent = item.name;

    const description = document.createElement("div");
    description.className = "muted";
    description.textContent = item.description;

    div.append(title, description);
    resultsContainer.appendChild(div);
  }
}

// Exported for the unit tests.
export { search, renderResults };
