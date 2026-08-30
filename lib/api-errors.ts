export async function getApiErrorMessage(
  response: Response,
  fallback = 'Something went wrong. Please try again.'
): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  } catch {
    // Response body is not JSON
  }

  if (response.status === 401) return 'You are not authorized. Please sign in again.';
  if (response.status === 404) return 'The requested resource was not found.';
  if (response.status === 503) return 'Service is temporarily unavailable. Please try again.';

  return fallback;
}
