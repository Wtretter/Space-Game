import { fatal_error } from "./error.js";
import {base_url} from "./request.js";


async function login(username, password) {
    const response = await fetch(base_url+"/login", {
        "method": "POST",
        "body": JSON.stringify({username: username, password: password}),
        "headers": {"Content-Type": "application/json"}
    });
    console.log(response)
    if (response.status != 200) {
        fatal_error(`Incorrect username or password`);
    }
    return (await response.json())[1];
}

async function register(username, password) {
    const response = await fetch(base_url+"/register", {
        "method": "POST",
        "body": JSON.stringify({username: username, password: password}),
        "headers": {"Content-Type": "application/json"}
    });
    return (await response.json())[1];
}


window.addEventListener("load", async ()=>{
    document.querySelector(".username").focus();

    /** @type {HTMLButtonElement} */
    const login_button = document.querySelector(".login");
    const register_button = document.querySelector(".register");
    login_button.addEventListener("click", async () => {
        const username = document.querySelector(".username").value;
        if (username.length == 0) {
            fatal_error("Username may not be empty");
        }
        const password = document.querySelector(".password").value;
        if (password.length == 0) {
            fatal_error("Password may not be empty");

        }
        const token = await login(username, password)

        if (token != null) {
            localStorage.setItem("token", JSON.stringify(token))
            location.replace("/");
        } else {
            console.log("error 401 unauth");
            throw Error(`test error 1`);
        }
        
    });
    register_button.addEventListener("click", async () => {
        const username = document.querySelector(".username").value;
        const password = document.querySelector(".password").value;
        const token = await register(username, password)
        location.reload();
    });
    /** @type {HTMLInputElement} */
    const password_field = document.querySelector(".password");
    password_field.addEventListener("keypress", (ev) => {
        if (ev.key == "Enter") {
            login_button.click();
        }
    })
    /** @type {HTMLInputElement} */
    const username_field = document.querySelector(".username");
    username_field.addEventListener("keypress", (ev) => {
        if (ev.key == "Enter") {
            document.querySelector(".password").focus();
        }
    })
});
