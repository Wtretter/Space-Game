import {Future, Sleep} from "./Async.js";

const base_url = window.location.protocol+"//"+window.location.hostname+":42000";
let token = null;

console.log("BASE URL", base_url);


async function get_ship(){
    try {
        const response = await fetch(base_url+"/ship/get", {
            "method": "POST",
            "body": JSON.stringify({token: token}),
            "headers": {"Content-Type": "application/json"}
        });
        if (response.status != 200){
            return null
        }
        return await response.json();
    } catch {
        return null;
    }
} 

async function get_status(){
    try {
        const response = await fetch(base_url+"/status", {
            "method": "POST",
            "body": JSON.stringify({token: token}),
            "headers": {"Content-Type": "application/json"}
        });
        if (response.status != 200){
            return null
        }
        return await response.json();
    } catch {
        return null;
    }
} 

async function move_ship(direction_input){
    let direction;
    let axis = direction_input[0].toLowerCase();

    if (direction_input[1] == "+"){
        direction = "up"
    }
    else {
        direction = "down"
    }
    const response = await fetch(base_url+`/move/${axis}/${direction}`, {
        "method": "POST",
        "body": JSON.stringify({token: token}),
        "headers": {"Content-Type": "application/json"}
    });
    return await response.json();
}

async function attack_ship(){
    
    const response = await fetch(base_url+`/piracy/fight`, {
        "method": "POST",
        "body": JSON.stringify({token: token}),
        "headers": {"Content-Type": "application/json"}
    });
    return await response.json();
}


async function get_enemies(){
    
    const response = await fetch(base_url+`/piracy/get`, {
        "method": "POST",
        "body": JSON.stringify({token: token}),
        "headers": {"Content-Type": "application/json"}
    });
    return await response.json();
}

async function run_away(ship){
    if (ship.time_in_combat * ship.jump_cooldown_amount >= ship.cargo.length) {
        const response = await fetch(base_url+`/piracy/run`, {
            "method": "POST",
            "body": JSON.stringify({token: token}),
            "headers": {"Content-Type": "application/json"}
        });
        return true;
    }
    else {
        print_to_log("Your jumpdrive is not ready yet!")
        const drive_cooldown = Math.floor(ship.cargo.length / ship.jump_cooldown_amount) - ship.time_in_combat
        print_to_log(`Jumpdrive ready in ${drive_cooldown} turns`)
        const response = await fetch(base_url+`/piracy/dodge`, {
            "method": "POST",
            "body": JSON.stringify({token: token}),
            "headers": {"Content-Type": "application/json"}
        });
        return false;
    }
    
}

function print_to_log(str){
    const log_element = document.querySelector(".log");
    const message_element = log_element.appendChild(document.createElement("p"));
    message_element.textContent = str;
    log_element.scrollTo(0, log_element.scrollHeight)
}


function add_divider_to_log(){
    const log_element = document.querySelector(".log");
    const divider_element = log_element.appendChild(document.createElement("div"));
    divider_element.classList.add("divider");
    log_element.scrollTo(0, log_element.scrollHeight)
}



window.addEventListener("load", async ()=>{
    try {
        token = JSON.parse(localStorage.getItem("token"));
    } catch {
        location.replace("/login.html");
        return;
    }
    if (!token || await get_status() != "success") {
        location.replace("/login.html");
        return;
    }
    if (!await get_ship()){
        location.replace("/shipyard.html");
        return;
    }
    const logout_button = document.querySelector(".logout")
    logout_button.addEventListener("click", async () => {
        localStorage.removeItem("token");
        location.replace("/login.html");
    })
    main_loop()
});


async function display_combat(ship, enemies, log) {
    let current_time = 0
    const ships_by_id = {
        [ship.id]: ship.name
    }
    for (const attacker of enemies) {
        console.log(attacker)
        ships_by_id[attacker.id] = attacker.name
    }
    for (const event of log) {
        if (event.type == "Time Passed") {
            current_time += event.contents
            await Sleep(event.contents * 1000)
        } else if (event.type == "Damage Taken") {
            const [id, amount] = event.contents
            print_to_log(`${current_time.toFixed(2)}s ${ships_by_id[id]} took ${amount} damage`)
        }
        
        else {
            print_to_log(`${event.type} - ${event.contents}`)
        }
    }
}

async function combat_loop(ship) {
    const inputs_element = document.querySelector(".inputs");
    inputs_element.innerHTML = "";
    const finished = new Future();

    const attack_button = inputs_element.appendChild(document.createElement("button"));
    attack_button.textContent = "Attack"

    attack_button.addEventListener("click", async () => {
        inputs_element.innerHTML = "";
        const enemies = await get_enemies()
        const log = await attack_ship()
        await display_combat(ship, enemies, log)
        finished.resolve()
    })

    const run_button = inputs_element.appendChild(document.createElement("button"));
    run_button.textContent = "Run"

    run_button.addEventListener("click", async () => {
        inputs_element.innerHTML = "";
        const combat_over = await run_away(ship)
        if (combat_over) {
            print_to_log("You have escaped")
        }
        finished.resolve()
    })

    await finished;
}

async function non_combat_loop(ship, station) {
    if (station != null){
        print_to_log("there is a station in this sector")
        print_station(station)
    }

    const inputs_element = document.querySelector(".inputs");
    inputs_element.innerHTML = "";
    const finished = new Future();

    const move_container = inputs_element.appendChild(document.createElement("div"))
    move_container.classList.add("move-container")
    const move_con_top = move_container.appendChild(document.createElement("div"))
    const move_con_bottom = move_container.appendChild(document.createElement("div"))

    for (const direction of ["X+", "Y+", "Z+"]) {
        const move_button = move_con_top.appendChild(document.createElement("button"))
        move_button.textContent = direction;
        move_button.addEventListener("click", async () => {
            await move_ship(direction)
            finished.resolve();
        });
    }
    for (const direction of ["X-", "Y-", "Z-"]) {
        const move_button = move_con_bottom.appendChild(document.createElement("button"))
        move_button.textContent = direction
        move_button.addEventListener("click", async () => {
            await move_ship(direction)
            finished.resolve();
        });

    }

    await finished;
}

function print_ship(ship) {

    const ship_info = document.querySelector(".ship-info");
    ship_info.innerHTML = ""
    const name_element = ship_info.appendChild(document.createElement("p"));
    name_element.textContent = "Ship name: " + ship.name;

    const coords_element = ship_info.appendChild(document.createElement("p"));
    coords_element.textContent = `Coords: X:${ship.coords.x} | Y:${ship.coords.y} | Z:${ship.coords.z}`
    console.log(ship.coords)

    const hp_element = ship_info.appendChild(document.createElement("p"));
    hp_element.textContent = "Hull: " + ship.hitpoints;

    const cargo_label = ship_info.appendChild(document.createElement("p"));
    cargo_label.textContent = "Cargo: " + ship.cargo.length + "/" + ship.cargo_space;
    const cargo_list_element = ship_info.appendChild(document.createElement("div"));
    for (const trade_good of ship.cargo) {
        const cargo_element = cargo_list_element.appendChild(document.createElement("p"));
        cargo_element.textContent = "- " + trade_good.name;
    }

    const money_element = ship_info.appendChild(document.createElement("p"));
    money_element.textContent = "Funds: " + ship.money;
}

function print_station(station) {
    print_to_log(`Station name: ${station.name}`)
    print_to_log("Goods for sale:")
    for (const trade_good of station.sale_goods) {
        print_to_log(`- ${trade_good.name} for ${trade_good.buy_price}`)
    }
}

async function main_loop(){
    console.log("starting main loop")
    while (true) {
        print_to_log((new Date()).toLocaleTimeString())
        const [ship, station] = await get_ship();
        print_ship(ship)
        print_to_log(`You have entered sector: X:${ship.coords.x}|Y:${ship.coords.y}|Z:${ship.coords.z}`)
        if (ship.enemies.length != 0){
            print_to_log("You are in combat")
            await combat_loop(ship)
        }
        else {
            await non_combat_loop(ship, station)
        }
        add_divider_to_log()
    }
}