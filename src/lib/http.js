const DEFAULT_TIMEOUT_MS = 20_000;

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TestmeQA-JobEngine/1.0; +https://testmeqa.com)",
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}
