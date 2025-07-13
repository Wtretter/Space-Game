import {base_url} from "./config.js";
import {fatal_error} from "./error.js";
let token = JSON.parse(localStorage.getItem("token"));


async function create_ship(ship_name){
    try {
        console.log(token)
        const response = await fetch(base_url+"/ship/create", {
            "method": "POST",
            "body": JSON.stringify({ship_name: ship_name, token: token}),
            "headers": {"Content-Type": "application/json"}
        });
        if (response.status != 200){
            console.log("AAAAAAAAAAAAAA");
            location.replace("/login.html");
            return null;
        }
        return await response.json();
    } catch {
        return null;
    }
} 


window.addEventListener("load", async ()=>{
    const create_button = document.querySelector(".create-ship");
    create_button.addEventListener("click", async () => {
        const ship_name = document.querySelector(".ship-name").value;
        if (ship_name == "") {
            fatal_error(`"Ship Name" may not be empty`);
        }
        if (ship_name.length > 32) {
            fatal_error(`ship_name input too long, max length 32 char`);
        }
        await create_ship(ship_name)


        location.replace("/");
    });
});
