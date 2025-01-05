const base_url = window.location.protocol+"//"+window.location.hostname+":42000";

async function login(username, password) {
    const response = await fetch(base_url+"/login", {
        "method": "POST",
        "body": JSON.stringify({username: username, password: password}),
        "headers": {"Content-Type": "application/json"}
    });
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
    document.querySelector(".username").focus()
    /** @type {HTMLButtonElement} */
    const login_button = document.querySelector(".login");
    const register_button = document.querySelector(".register");
    login_button.addEventListener("click", async () => {
        const username = document.querySelector(".username").value;
        const password = document.querySelector(".password").value;
        const token = await login(username, password)
        localStorage.setItem("token", JSON.stringify(token))
        location.replace("/");
    });
    register_button.addEventListener("click", async () => {
        const username = document.querySelector(".username").value;
        const password = document.querySelector(".password").value;
        const token = await register(username, password)
        location.reload();
    });
    /** @type {HTMLInputElement} */
    const password_field = document.querySelector(".password");
    const thing = password_field.addEventListener("keypress", (ev) => {
        if (ev.key == "Enter") {
            login_button.click()
        }
    })
});
