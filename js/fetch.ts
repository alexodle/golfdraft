// fetch polyfill
import 'whatwg-fetch';

import * as _ from 'lodash';

function ensureCredentials(init?: RequestInit): RequestInit {
  return _.extend({ credentials: "same-origin" }, init);
}

function ensureSuccess(resp: Response): Response {
  if (resp.ok) return resp;

  const error = new Error(resp.statusText);
  (<any>error).response = resp;
  throw error;
}

function _fetch(url: string, init?: RequestInit) {
  return window.fetch(url, ensureCredentials(init))
    .then(ensureSuccess);
}

function _fetchJson(url: string, init?: RequestInit) {
  return _fetch(url, init)
    .then((resp) => {
      if (!resp.json) return null;
      return resp.json()
        .catch((err) => {
          console.debug(err);
        });
    });
}

export function fetch(url: string, init?: RequestInit) {
  return _fetch(url);
}

export function del(url: string) {
  return _fetch(url, { method: "DELETE" });
}

export function fetchJson(url) {
  return _fetchJson(url);
}

export function post(url: string) {
  return _fetchJson(url, { method: "POST" });
}

export function postJson(url, data) {
  return _fetchJson(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export function put(url) {
  return _fetchJson(url, { method: "PUT" });
}

export function putJson(url, data) {
  return _fetchJson(url, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });
}
