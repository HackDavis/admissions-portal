export default async function fetchPost(
  path: string,
  body: object,
  cache: boolean = false
) {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: cache ? 'force-cache' : 'no-store',
    credentials: 'include',
  });
}
