const { TITO_AUTH_TOKEN, TITO_EVENT_BASE_URL } = process.env;

export async function TitoRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!TITO_AUTH_TOKEN || !TITO_EVENT_BASE_URL) {
    throw new Error('Missing Tito API configuration');
  }

  const url = `${TITO_EVENT_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Token token=${TITO_AUTH_TOKEN}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    const retryAfter = response.headers.get('Retry-After');

    // Get the retry time
    const error = new Error(`Tito API ${response.status}: ${errorText}`);
    if (retryAfter) (error as any).retryAfter = retryAfter;

    throw error;
  }

  // Handle DELETE requests which might return empty/204
  if (response.status === 204) return {} as T;

  return response.json();
}
