// variables
import { gamespeed } from "./config.js";


window.addEventListener("load", ()=> {
    let settings_list = document.body.appendChild(document.createElement("div"));
    let gamespeed_element = settings_list.appendChild(document.createElement("p"));
    gamespeed_element.textContent = gamespeed.show();
    const arrow_button_container = settings_list.appendChild(document.createElement("div"));
    const up_arrow = arrow_button_container.appendChild(document.createElement("button"));
    up_arrow.textContent = "^";
    up_arrow.addEventListener("click", ()=>{
        gamespeed.value += 1;
        gamespeed_element.textContent = gamespeed.show();
    });

    const down_arrow = arrow_button_container.appendChild(document.createElement("button"));
    down_arrow.textContent = "v";
    down_arrow.addEventListener("click", ()=>{
        gamespeed.value -= 1;
        gamespeed_element.textContent = gamespeed.show();
    });
})