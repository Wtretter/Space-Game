import {Future, Sleep} from "./Async.js";
import {Scene, ShipNode, LaserNode, DamageNode } from "./scene.js";
import {RandBetween} from "./utils.js";

const base_url = window.location.protocol+"//"+window.location.hostname+":42000";
let token = null;
let gamespeed = 5;

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

function error(string) {
    print_newline_to_log()
    print_to_log(`*${string}*`)
    throw Error(string);
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


async function buy(name) {
    const response = await fetch(base_url+`/cargo/buy`, {
        "method": "POST",
        "body": JSON.stringify({token: token, name: name}),
        "headers": {"Content-Type": "application/json"}
    });    
}

async function sell(item_id) {
    const response = await fetch(base_url+`/cargo/sell`, {
        "method": "POST",
        "body": JSON.stringify({token: token, item_id: item_id}),
        "headers": {"Content-Type": "application/json"}
    });    
}

function print_newline_to_log() {
    const log_element = document.querySelector(".log");
    const message_element = log_element.appendChild(document.createElement("p"));
    message_element.innerHTML = "&nbsp";
    log_element.scrollTo(0, log_element.scrollHeight)
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
    const logout_button = document.querySelector(".logout");
    logout_button.addEventListener("click", async () => {
        localStorage.removeItem("token");
        location.replace("/login.html");
    });
    main_loop();
});


async function display_combat(ship, enemies, log) {
    const ship_info = document.querySelector(".ship-info");
    ship_info.innerHTML = "";
    const canvas = ship_info.appendChild(document.createElement("canvas"));
    canvas.width = ship_info.clientWidth;
    canvas.height = ship_info.clientHeight;
    const locations_by_id = {
        [ship.id]: [canvas.width/2, canvas.height-100]
    };
    for (const attacker of enemies) {
        locations_by_id[attacker.id] = [canvas.width/2, 100]
    }
    const nodes_by_id = {};

    const scene = new Scene(canvas);
    scene.start();
    const shipNode = new ShipNode(true, canvas.width/2, canvas.height-60, ship.hitpoints/ship.max_hitpoints, ship.name);
    scene.nodes.push(shipNode);
    nodes_by_id[ship.id] = shipNode;

    for (const enemy of enemies) {
        const enemyNode = new ShipNode(false, canvas.width/2, 60, enemy.hitpoints/enemy.max_hitpoints, enemy.name);
        scene.nodes.push(enemyNode);
        nodes_by_id[enemy.id] = enemyNode;
    }
    
    let current_time = 0
    const ships_by_id = {
        [ship.id]: ship
    };
    const items_by_id = {};
    for (const item of ship.installed_items) {
        items_by_id[item.id] = [item.name, ship];
    }
    for (const attacker of enemies) {
        ships_by_id[attacker.id] = attacker;
        for (const item of attacker.installed_items) {
            items_by_id[item.id] = [item.name, attacker];
        }
    }
    for (const event of log) {
        if (event.type == "Time Passed") {
            current_time += event.contents;
            await Sleep(event.contents * 1000 * gamespeed);
        } else if (event.type == "Damage Taken") {
            let [source_id, target_id, amount, damage_type] = event.contents;

            const target_ship = ships_by_id[target_id];
            const target_node = nodes_by_id[target_id];
            const outgoing = locations_by_id[source_id];
            const incoming = locations_by_id[target_id];

            const damage_node = new DamageNode("white", +amount.toFixed(2), incoming[0], incoming[1]);
            scene.nodes.push(damage_node);

            print_to_log(`${target_ship.name} took ${+amount.toFixed(2)} damage`);

            target_ship.hitpoints -= amount;
            target_node.health = target_ship.hitpoints/target_ship.max_hitpoints;

            if (damage_type == "Laser") {
                let color;
                if (source_id == ship.id) {
                    color = "green";
                } else {
                    color = "red";
                }

                const laser = new LaserNode(color, outgoing[0] + RandBetween(-25, 25), outgoing[1], incoming[0] + RandBetween(-25, 25), incoming[1]);
                scene.nodes.push(laser);
            }
        } else if (event.type == "Item Used") {
            const [name, ship] = items_by_id[event.contents];
            print_newline_to_log();
            print_to_log(`${current_time.toFixed(2)}s ${ship.name} used ${name}`);
        } else if (event.type == "Ship Destroyed") {
            const dead_ship = ships_by_id[event.contents];
            print_newline_to_log();
            print_to_log(`${dead_ship.name} was destroyed`);
        } else if (event.type == "Dodged") {
            const dodger = ships_by_id[event.contents];
            print_to_log(`${dodger.name} Dodged`);
        }

        else {
            print_to_log(`${event.type} - ${event.contents}`);
        }
    }
    await Sleep(1000);
    scene.stop();
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
        const combat_over = await run_away(ship);
        if (combat_over) {
            print_to_log("You have escaped")
        }
        finished.resolve();
    })

    await finished;
}

async function non_combat_loop(ship, station) {
    const inputs_element = document.querySelector(".inputs");
    inputs_element.innerHTML = "";

    const finished = new Future();
   
    if (station != null){
        print_to_log("there is a station in this sector");
        print_station(station);
        const station_container = inputs_element.appendChild(document.createElement("div"));
        station_container.classList.add("station-container");
        const buy_button = station_container.appendChild(document.createElement("button"));
        buy_button.classList.add("buy");
        buy_button.textContent = "Buy";
        buy_button.addEventListener("click", async () => {
            const buy_window = document.body.appendChild(document.createElement("div"));
            buy_window.classList.add("popup");
            const funds_on_hand = buy_window.appendChild(document.createElement("p"))
            funds_on_hand.textContent = `Funds available: ${ship.money}`
            funds_on_hand.classList.add("popup-window-funds")
            for (const buy_item of station.sale_goods) {
                const item_button = buy_window.appendChild(document.createElement("button"))
                item_button.textContent = `${buy_item.name} for $${buy_item.buy_price}`
                item_button.addEventListener("click", async () => {
                    if (ship.money < buy_item.buy_price) {
                        error("Insufficient Funds")
                    } else if (ship.cargo.length >= ship.cargo_space) {
                        error("Insufficient Cargo Space")
                    } else {
                        buy(buy_item.name)
                        ship.money -= buy_item.buy_price
                        funds_on_hand.textContent = `Funds available: ${ship.money}`
                        ship.cargo.push(buy_item)
                        print_newline_to_log()
                        print_to_log(`bought: ${buy_item.name}`)
                    }
                });
            }

            const exit_button = buy_window.appendChild(document.createElement("button"));
            exit_button.classList.add("exit");
            exit_button.textContent = "Close";
            exit_button.addEventListener("click", async () => {
                buy_window.remove();
                finished.resolve();
            });
        });

        const sell_button = station_container.appendChild(document.createElement("button"))
        sell_button.classList.add("sell")
        sell_button.textContent = "Sell";
        sell_button.addEventListener("click", async () => {
            const sell_window = document.body.appendChild(document.createElement("div"));
            sell_window.classList.add("popup");
            const funds_on_hand = sell_window.appendChild(document.createElement("p"))
            funds_on_hand.textContent = `Funds available: ${ship.money}`
            funds_on_hand.classList.add("popup-window-funds")
            for (const sell_item of ship.cargo) {
                const item_button = sell_window.appendChild(document.createElement("button"))
                item_button.textContent = `${sell_item.name} for $${sell_item.sell_price}`
                item_button.addEventListener("click", async () => {
                    item_button.remove()
                    sell(sell_item.id)
                    ship.money += sell_item.sell_price
                    funds_on_hand.textContent = `Funds available: ${ship.money}`
                    print_newline_to_log()
                    print_to_log(`sold: ${sell_item.name}`)
                });
            }

            const exit_button = sell_window.appendChild(document.createElement("button"));
            exit_button.classList.add("exit");
            exit_button.textContent = "Close";
            exit_button.addEventListener("click", async () => {
                sell_window.remove();
                finished.resolve();
            });
        });

        const upgrade_button = station_container.appendChild(document.createElement("button"))
        upgrade_button.classList.add("upgrade")
        upgrade_button.textContent = "Upgrade";
        upgrade_button.addEventListener("click", async () => {
            const upgrade_window = document.body.appendChild(document.createElement("div"));
            upgrade_window.classList.add("popup");
            const upgrade_row = upgrade_window.appendChild(document.createElement("div"));
            upgrade_row.classList.add("row");
            upgrade_row.classList.add("item-row");

            const installable = upgrade_row.appendChild(document.createElement("div"));
            installable.classList.add("column");
            installable.classList.add("center");
            for (const item of ship.cargo) {
                if (item.installable) {
                    const button = installable.appendChild(document.createElement("button"));
                    button.textContent = item.name
                }
            }
            const installed = upgrade_row.appendChild(document.createElement("div"));
            installed.classList.add("column");
            for (const item of ship.installed_items) {
                const button = installed.appendChild(document.createElement("button"));
                button.textContent = item.name
            }
            const exit_button = upgrade_window.appendChild(document.createElement("button"));
            exit_button.classList.add("exit");
            exit_button.textContent = "Close";
            exit_button.addEventListener("click", async () => {
                upgrade_window.remove();
                finished.resolve();
            });
        });    
    }

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

    const hp_element = ship_info.appendChild(document.createElement("p"));
    hp_element.textContent = "Hull: " + +ship.hitpoints.toFixed(2);

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
        liveTimer()
        setInterval(liveTimer, 1000)
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

function liveTimer(){
    const timer = document.querySelector(".timer-row");
    timer.textContent = (new Date()).toLocaleTimeString();
}