// fetch polyfill
import 'whatwg-fetch';

function ensureSuccess(resp: Response): Response {
  if (resp.ok) return resp;

  const error = new Error(resp.statusText);
  (<any>error).response = resp;
  throw error;
}

function _fetch(url: string, init?: RequestInit) {
  return window.fetch(url, init)
    .then(ensureSuccess);
}

function _fetchJson(url: string, init?: RequestInit) {
  return _fetch(url, init)
    .then((resp) => resp.json());
}

export function fetch(url: string, init?: RequestInit) {
  return _fetch(url);
}

export function del(url: string) {
  return _fetch(url, {
    method: "DELETE",
    credentials: "same-origin"
  });
}

export function fetchJson(url) {
  return _fetchJson(url);
}

export function post(url: string) {
  return _fetchJson(url, {
    method: "POST",
    credentials: "same-origin"
  });
}

export function postJson(url, data) {
  return _fetchJson(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "same-origin"
  });
}

export function put(url) {
  return _fetchJson(url, {
    method: "PUT",
    credentials: "same-origin"
  });
}

export function putJson(url, data) {
  return _fetchJson(url, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "same-origin"
  });
}
