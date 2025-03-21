const base_url = window.location.protocol+"//"+window.location.hostname+":42000";


async function login(username, password) {
    const response = await fetch(base_url+"/login", {
        "method": "POST",
        "body": JSON.stringify({username: username, password: password}),
        "headers": {"Content-Type": "application/json"}
    });
    console.log(response)
    if (response.status != 200) {
        const info_text = document.querySelector(".info_text");
        const incorrect_pw_text = info_text.appendChild(document.createElement("p"));
        incorrect_pw_text.textContent = "\n Incorrect username or password";
        incorrect_pw_text.style.color = "red";

        throw Error(`${response.status} ${response.statusText}: ${await response.text()}`);
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
        if (username == "") {
            const info_text = document.querySelector(".info_text");
            const bad_username_text = info_text.appendChild(document.createElement("p"));
            bad_username_text.textContent = "\n Username may not be empty";
            bad_username_text.style.color = "red";
            throw Error(`username input empty str`);

        }
        const password = document.querySelector(".password").value;
        if (password == "") {
            const info_text = document.querySelector(".info_text");
            const bad_pw_text = info_text.appendChild(document.createElement("p"));
            bad_pw_text.textContent = "\n Password may not be empty";
            bad_pw_text.style.color = "red";
            throw Error(`password input empty str`);

        }
        const token = await login(username, password)
        console.log(token)

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
