"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// fetch polyfill
require("whatwg-fetch");
const _ = require("lodash");
function ensureCredentials(init) {
    return _.extend({ credentials: "same-origin" }, init);
}
function ensureSuccess(resp) {
    if (resp.ok)
        return resp;
    const error = new Error(resp.statusText);
    error.response = resp;
    throw error;
}
function _fetch(url, init) {
    return window.fetch(url, ensureCredentials(init))
        .then(ensureSuccess)
        .then((resp) => {
        if (!resp.json)
            return null;
        try {
            return resp.json()
                .catch((err) => {
                console.debug(err);
                return null;
            });
        }
        catch (e) {
            console.debug(e);
            return null;
        }
    });
}
function fetch(url, init) {
    return _fetch(url, init);
}
exports.fetch = fetch;
function del(url) {
    return fetch(url, { method: "DELETE" });
}
exports.del = del;
function post(url) {
    return fetch(url, { method: "POST" });
}
exports.post = post;
function postJson(url, data) {
    return fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });
}
exports.postJson = postJson;
function put(url) {
    return fetch(url, { method: "PUT" });
}
exports.put = put;
function putJson(url, data) {
    return fetch(url, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });
}
exports.putJson = putJson;
