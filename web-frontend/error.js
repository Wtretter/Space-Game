import { Sleep } from "./Async.js";

const error_callbacks = [];
const error_div = document.body.appendChild(document.createElement("div"));
error_div.classList.add("error-div")

export function register_error_callback(func) {
    error_callbacks.push(func);
}


export async function error(string) {
    for (const callback of error_callbacks) {
        callback(string);
    }
    const error_window = error_div.appendChild(document.createElement("div"));
    error_window.classList.add("error-popup");
    const error_text = error_window.appendChild(document.createElement("p"))
    error_text.textContent = string
    const exit_button = error_window.appendChild(document.createElement("button"));
    exit_button.textContent = "X";
    exit_button.addEventListener("click", async () => {
        error_window.remove();
    })
    await Sleep(20)
    error_window.style.opacity = 1
    await Sleep(5000)
    error_window.style.opacity = 0
    await Sleep(320)
    error_window.remove()

}

export function fatal_error(string) {
    error(string);
    throw Error(string);
}
