// fetch polyfill
import 'whatwg-fetch';

function ensureCredentials(init: RequestInit): RequestInit {
  return { credentials: 'same-origin', ...init };
}

function ensureSuccess(resp: Response): Response {
  if (resp.ok) return resp;

  const error = new Error(resp.statusText);
  (<any>error).response = resp;
  throw error;
}

function pathJoin(a: string, b: string) {
  if (a.endsWith('/')) return a + b;
  return `${a}/${b}`;
}

function normalizeUrl(url: string): string {
  if (url.startsWith('/')) return url;
  return pathJoin(window.location.pathname, url);
}

async function _fetch(url: string, init: RequestInit) {
  const normalizedUrl = normalizeUrl(url);
  const resp = ensureSuccess(await window.fetch(normalizedUrl, ensureCredentials(init)));
  if (!resp.json) return null;
  
  try {
    return await resp.json();
  } catch (e) {
    console.debug(e);
    return null;
  }
}

export function fetch(url: string, init?: RequestInit) {
  return _fetch(url, init);
}

export function del(url: string) {
  return fetch(url, { method: "DELETE" });
}

export function post(url: string) {
  return fetch(url, { method: "POST" });
}

export function postJson(url: string, data) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export function put(url: string) {
  return fetch(url, { method: "PUT" });
}

export function putJson(url: string, data) {
  return fetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });
}
