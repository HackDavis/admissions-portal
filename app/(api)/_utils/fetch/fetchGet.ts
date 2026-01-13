export default async function fetchGet(path: string, cache: boolean = false) {
  return fetch(path, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: cache ? 'force-cache' : 'no-store',
    credentials: 'include',
  });
}
