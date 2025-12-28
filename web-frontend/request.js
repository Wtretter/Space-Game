export const base_url = window.location.protocol+"//"+window.location.host+"/api";
let token = null;


export async function post_request(endpoint, body = undefined) {
    try {
        if (!body) {
            body = {};
        }
        body["token"] = token;
        const response = await fetch(base_url+endpoint, {
            "method": "POST",
            "body": JSON.stringify(body),
            "headers": {"Content-Type": "application/json"},
        });
        if (response.status != 200){
            return null;
        }
        return await response.json();
    } catch {
        return null;
    }
}


export async function try_request(endpoint, body = undefined) {
    if (!body) {
        body = {};
    }
    body["token"] = token;
    const response = await fetch(base_url+endpoint, {
        "method": "POST",
        "body": JSON.stringify(body),
        "headers": {"Content-Type": "application/json"},
    });
    if (response.status != 200) {
        throw Error(`${response.status} ${response.statusText}: ${await response.text()}`);
    }
    return await response.json();
}


export async function init() {
    try {
        token = JSON.parse(localStorage.getItem("token"));
    } catch {
        location.replace("/login.html");
        return;
    }

    if (!token || await post_request("/status") != "success") {
        location.replace("/login.html");
        return;
    }
}


export function open_websocket() {
    const ws = new WebSocket(`${base_url}/ws`);
    ws.onopen = () => {
        ws.send(JSON.stringify(token));
    }
    return ws;
}

