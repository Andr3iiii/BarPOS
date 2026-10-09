export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const retryable = method === 'GET' || method === 'HEAD';
  const maxAttempts = retryable ? 2 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      if (retryable && attempt < maxAttempts && [502, 503, 504].includes(response.status)) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error('The server is temporarily unavailable. Please check your connection and try again.');
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('The server is temporarily unavailable. Please try again.');
}
