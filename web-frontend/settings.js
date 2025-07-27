import { init as request_init } from "./request.js";
import { settings, init as config_init } from "./config.js";
import { post_request } from "./request.js";


function add_int_setting(label, value){
    let element = document.createElement("div");
    element.classList.add("setting");
    let labelElement = element.appendChild(document.createElement("p"));
    labelElement.classList.add("label");
    labelElement.textContent = label;
    const input_element = element.appendChild(document.createElement("input"))
    input_element.type = "number";
    input_element.value = settings[value];
    input_element.addEventListener("change", ()=>{
        settings[value] = parseInt(input_element.value);
    });
    return element;
}

function add_bool_setting(label, value){
    let element = document.createElement("div");
    element.classList.add("setting");
    let labelElement = element.appendChild(document.createElement("p"));
    labelElement.classList.add("label");
    labelElement.textContent = label;
    const checkbox = element.appendChild(document.createElement("input"));
    if (settings[value]) {
        checkbox.checked = true;
    }
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", ()=>{
        settings[value] = checkbox.checked;
    });
    return element;
}

function add_enum_setting(label, value, options){
    let element = document.createElement("div");
    element.classList.add("setting");
    let labelElement = element.appendChild(document.createElement("p"));
    labelElement.classList.add("label");
    labelElement.textContent = label;
    const selector = element.appendChild(document.createElement("select"));
    for (let option of options){
        const option_element = selector.appendChild(document.createElement("option"));
        option_element.value = option;
        option_element.textContent = option;
    }
    selector.value = settings[value];
    
    selector.addEventListener("change", ()=>{
        settings[value] = selector.value;
    });
    return element;
}


window.addEventListener("load", async () => {
    await request_init();
    await config_init();
    const user = await post_request("/user/get");
    let settings_list = document.body.appendChild(document.createElement("div"));
    settings_list.classList.add("settings-list");

    // Non Admin Settings
    settings_list.appendChild(add_int_setting("Animation Speed", "animation_speed"));


    // Admin Only Settigns
    if (user.admin){
        const [ship,] = await post_request("/ship/get");

        settings_list.appendChild(add_enum_setting("Piracy", "piracy", ["ON", "OFF", "ALWAYS"]));
        const money_container = settings_list.appendChild(document.createElement("div"));
        money_container.classList.add("setting");
        const money_label = money_container.appendChild(document.createElement("p"));
        money_label.classList.add("label");
        money_label.textContent = "Money";
        const money_input = money_container.appendChild(document.createElement("input"));
        money_input.type = "number";
        money_input.value = `${ship.money}`;
        money_input.addEventListener("change", ()=>{
            post_request(`/admin/money/${money_input.value}`);
        })
    }

    const save_button = settings_list.appendChild(document.createElement("button"));
    save_button.classList.add("save-button");
    save_button.textContent = "Save Settings";
    save_button.addEventListener("click", async () => {
        await settings.save();
        location.replace("/");
    }); 
})