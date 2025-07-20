// variables
import { animation_speed, init, pirates_on } from "./config.js";

function add_float_setting(setting, min_value){
    let element = document.createElement("div");
    element.classList.add("setting");
    let label = element.appendChild(document.createElement("p"));
    label.classList.add("label");
    label.textContent = setting.show();
    const arrow_button_container = element.appendChild(document.createElement("div"));
    const up_arrow = arrow_button_container.appendChild(document.createElement("button"));
    up_arrow.textContent = "";
    up_arrow.addEventListener("click", ()=>{
        setting.value += 1; 
        label.textContent = setting.show();
    });
    const down_arrow = arrow_button_container.appendChild(document.createElement("button"));
    down_arrow.textContent = "";
    down_arrow.addEventListener("click", ()=>{
        setting.value -= 1;
        label.textContent = setting.show();
    });
    return element;
}


function add_int_setting(setting){
    let element = document.createElement("div");
    element.classList.add("setting");
    let label = element.appendChild(document.createElement("p"));
    label.classList.add("label");
    label.textContent = setting.show();
    const input_element = element.appendChild(document.createElement("input"))
    input_element.value = setting.value;
    input_element.addEventListener("change", ()=>{
        setting.value = parseInt(input_element.value);
        label.textContent = setting.show();
    });
    const arrow_button_container = element.appendChild(document.createElement("div"));
    arrow_button_container.classList.add("arrow-button-container")
    const up_arrow = arrow_button_container.appendChild(document.createElement("button"));
    up_arrow.textContent = "↑";
    up_arrow.addEventListener("click", ()=>{
        setting.value += 1;
        input_element.value = setting.value;
        label.textContent = setting.show();
    });
    const down_arrow = arrow_button_container.appendChild(document.createElement("button"));
    down_arrow.textContent = "↓";
    down_arrow.addEventListener("click", ()=>{
        setting.value -= 1;
        input_element.value = setting.value;
        label.textContent = setting.show();
    });
    return element;
}

function add_bool_setting(setting){
    let element = document.createElement("div");
    element.classList.add("setting");
    let label = element.appendChild(document.createElement("p"));
    label.classList.add("label");
    label.textContent = setting.show();
    const checkbox = element.appendChild(document.createElement("input"));
    if (setting.value) {
        checkbox.checked = true;
    }
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", ()=>{
        setting.value = checkbox.checked;
        label.textContent = setting.show();
    });
    return element;
}

function add_enum_setting(setting, options){
    let element = document.createElement("div");
    element.classList.add("setting");
    let label = element.appendChild(document.createElement("p"));
    label.classList.add("label");
    label.textContent = setting.show();
    const selector = element.appendChild(document.createElement("select"));
    for (let option of options){
        const option_element = selector.appendChild(document.createElement("option"));
        option_element.value = option;
        option_element.textContent = option;
    }
    selector.value = setting.value;
    
    selector.addEventListener("change", ()=>{
        setting.value = selector.value;
        label.textContent = setting.show();
    });
    return element;
}


window.addEventListener("load", ()=> {
    init()
    let settings_list = document.body.appendChild(document.createElement("div"));

    // gamespeed
    settings_list.appendChild(add_int_setting(animation_speed));

    // pirates
    settings_list.appendChild(add_enum_setting(pirates_on, ["ON", "OFF", "ALWAYS"]));
})