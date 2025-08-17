import {fatal_error} from "./error.js";
import {try_request, init as request_init} from "./request.js";


async function create_ship(ship_name){
    return await try_request("/ship/create", {ship_name: ship_name});
} 


window.addEventListener("load", async ()=>{
    request_init();

    const create_ship_button = document.querySelector(".create-ship");
    const ship_name_field = document.querySelector(".ship-name");
    ship_name_field.addEventListener("keypress", (ev) => {
        if (ev.key == "Enter") {
            create_ship_button.click();
        }
    })
    create_ship_button.addEventListener("click", async () => {
        const ship_name = document.querySelector(".ship-name").value;
        if (ship_name == "") {
            fatal_error(`Ship Name may not be empty`);
        }
        if (ship_name.length > 32) {
            fatal_error(`Ship Name too long, max length 32`);
        }

        try {
            await create_ship(ship_name);
            location.replace("/main.html");
        } catch (e) {
            console.log(e);
            //location.replace("/login.html");
        }
    });
});
