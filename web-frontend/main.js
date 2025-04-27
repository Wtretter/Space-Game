import {Future, Sleep} from "./Async.js";
import {error, register_error_callback} from "./error.js";
import {Scene, ShipNode, LaserNode, DamageNode } from "./scene.js";
import {RandBetween, RandChoice} from "./utils.js";
import {base_url} from "./config.js";
import {Vector2} from "./vector.js";
import {gamespeed} from "./config.js"
import { init } from "./config.js";


let token = null;
let is_typing = false;
let on_keydown = null;


register_error_callback(string => {
    print_newline_to_log()
    print_to_log(`*${string}*`)
});

async function scaled_sleep(time_in_ms) {
    await Sleep(time_in_ms * (10 / gamespeed.value));
}

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

var ws = new WebSocket(`${base_url}/ws`);
ws.onmessage = function(event) {
    print_to_chat(event.data);
};
ws.onopen = () => {
    ws.send(JSON.stringify(token));
}
            

async function send_request(endpoint, data) {
    const response = await fetch(base_url+endpoint, {
        "method": "POST",
        "body": JSON.stringify(data),
        "headers": {"Content-Type": "application/json"}
    });
    if (response.status != 200) {
        throw Error(`${response.status} ${response.statusText}: ${await response.text()}`);
    }
    return await response.json();
}


async function buy(name) {
    return await send_request("/cargo/buy", {token: token, name: name});
}

async function upgrade_hull() {
    return await send_request("/upgrade/hull", {token: token})
}

async function repair_hull() {
    return await send_request("/repair/hull", {token: token})
}

async function upgrade_cargo() {
    return await send_request("/upgrade/cargo", {token: token})
}

async function upgrade_install_space() {
    return await send_request("/upgrade/slots", {token: token})
}

async function sell(item_id) {
    return await send_request("/cargo/sell", {token: token, item_id: item_id}); 
}

async function install(item_id) {
    return await send_request("/cargo/install", {token: token, item_id: item_id});
}

async function uninstall(item_id) {
    return await send_request("/cargo/uninstall", {token: token, item_id: item_id});
}

async function get_notes() {
    return await send_request("/notes/get", {token: token});
}

async function push_note(title, contents, coords) {
    return await send_request("/notes/push", {token: token, title, contents, coords});
}

async function push_note_remove(coords) {
    return await send_request("/notes/remove", {token: token, coords});
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

function print_to_chat(str){
    const chat_element = document.querySelector(".chat");
    const message_element = chat_element.appendChild(document.createElement("p"));
    message_element.textContent = `[${new Date().toLocaleTimeString()}] ${str}`;
    chat_element.scrollTo(0, chat_element.scrollHeight)
}


function add_divider_to_log(){
    const log_element = document.querySelector(".log");
    const divider_element = log_element.appendChild(document.createElement("div"));
    divider_element.classList.add("divider");
    log_element.scrollTo(0, log_element.scrollHeight)
}

function coords_to_str(coords){
    return `${coords.x}, ${coords.y}, ${coords.z}`
}

function layout_check(){
    if (window.innerWidth < 900) {
        document.body.classList.add("vertical");
    }
    else {
        document.body.classList.remove("vertical");
    }
}

window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) {
        window.location.reload();
    }
});


window.addEventListener("load", async ()=>{
    init()
    
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
   
    liveTimer()
    setInterval(liveTimer, 1000)

    window.addEventListener("keydown", (ev)=>{
        if (is_typing) {
            return;
        }
        if (on_keydown != null) {
            on_keydown(ev.key);
        }
    })

    const settings_button = document.querySelector(".settings");
    settings_button.addEventListener("click", async () => {
       location.assign("/settings.html");
    });

    const logout_button = document.querySelector(".logout");
    logout_button.addEventListener("click", async () => {
        localStorage.removeItem("token");
        location.replace("/login.html");
    });
    const note_button = document.querySelector(".notebook");
    note_button.addEventListener("click", async () => {
        is_typing = true;
        const notebook_window = document.body.appendChild(document.createElement("div"));
        notebook_window.classList.add("popup");
        notebook_window.classList.add("no-scroll");

        const notebook_sub_window = notebook_window.appendChild(document.createElement("div"));
        notebook_sub_window.classList.add("note-container")
        const note_overview = notebook_sub_window.appendChild(document.createElement("div"));
        note_overview.classList.add("note-overview")
        const note_detail_view = notebook_sub_window.appendChild(document.createElement("div"));
        const panel = note_detail_view.appendChild(document.createElement("textarea"));
        note_detail_view.classList.add("note-detail-view");
        panel.classList.add("panel");

        const exit_button = notebook_window.appendChild(document.createElement("button"));
        exit_button.textContent = "X"
        exit_button.classList.add("x-button")
        exit_button.addEventListener("click", () => {
            is_typing = false;
            notebook_window.remove()
        })

        let note_coords = new Set();
        function add_note(note) {
            const note_open_button = note_overview.appendChild(document.createElement("button"))
            note_open_button.classList.add("note-open-button")
            note_open_button.textContent = `${note.title} - ${note.coords.x}/${note.coords.y}/${note.coords.z} - ${note.edited_timestamp} UTC`
            note_open_button.addEventListener("click", () => {
                open_note = note;
                panel.value = note.contents;
            })
            note_coords.add(coords_to_str(note.coords));
            const note_close_button = note_open_button.appendChild(document.createElement("button"))
            // &#x1F5D1; is a trashcan icon
            note_close_button.innerHTML = `&#x1F5D1;`;
            note_close_button.addEventListener("click", () => {
                push_note_remove(note.coords);
                note_open_button.remove();
                note_coords.delete(coords_to_str(note.coords))
                if (coords_to_str(note.coords) == coords_to_str(ship.coords)) {
                    new_note_button.style.display = "inherit"
                }
            })
        }

        let open_note = null;
        const [ship, ] = await get_ship();

        const new_note_button = note_overview.appendChild(document.createElement("button"))
        new_note_button.textContent = "Add New Note";
        new_note_button.addEventListener("click", async () => {
            if (note_coords.has(coords_to_str(ship.coords))) {
                return;
            }
            open_note = await push_note("New Note", "", ship.coords);
            add_note(open_note);
            panel.value = open_note.contents;
            new_note_button.style.display = "none";
        })

        panel.addEventListener("change", async () => {
            if (!open_note) {
                return;
            }
            open_note.contents = panel.value;
            await push_note(open_note.title, open_note.contents, open_note.coords);
        })

        const notes = await get_notes()
        for (const note of notes) {
            add_note(note);
        }

        if (note_coords.has(coords_to_str(ship.coords))) {
            new_note_button.style.display = "none";
        }
    })

    const log_header = document.querySelector(".log-header");
    const chat_header = document.querySelector(".chat-header");
    const log_box = document.querySelector(".log");
    const chat_box = document.querySelector(".chat");
    /** @type {HTMLTextAreaElement} */
    const chat_area = document.querySelector(".chat-textarea");

    log_header.addEventListener("click", () => {
        log_box.classList.remove("disabled");
        log_header.classList.remove("inactive");
        chat_area.classList.add("disabled");
        chat_box.classList.add("disabled");
        chat_header.classList.add("inactive");
    })

    chat_header.addEventListener("click", () => {
        log_box.classList.add("disabled");
        log_header.classList.add("inactive");
        chat_area.classList.remove("disabled");
        chat_box.classList.remove("disabled");
        chat_header.classList.remove("inactive");
    })

    chat_area.addEventListener("focus", () => {
        is_typing = true;
    })

    chat_area.addEventListener("blur", () => {
        is_typing = false;
    })

    chat_area.addEventListener("keydown", (ev)=>{
        if (ev.key == "Enter") {
            ev.preventDefault();
            if (chat_area.value != ""){
                ws.send(chat_area.value);
                chat_area.value = "";
            }
        }
    })

    layout_check()
    window.addEventListener("resize", () => {
        layout_check()
    })

    main_loop();
});


async function display_combat(ship, enemies, log) {
    on_keydown = null;

    const ship_info = document.querySelector(".ship-info");
    ship_info.innerHTML = "";
    const canvas = ship_info.appendChild(document.createElement("canvas"));
    canvas.width = ship_info.clientWidth;
    canvas.height = ship_info.clientHeight;
    const locations_by_id = {
        [ship.id]: [canvas.width/2, canvas.height-100]
    };
    const nodes_by_id = {};

    const scene = new Scene(canvas);
    scene.start();
    const shipNode = new ShipNode(true, canvas.width/2, canvas.height-60, ship.hitpoints/ship.max_hitpoints, ship.name);
    scene.add_node(shipNode)
    nodes_by_id[ship.id] = shipNode;
    const enemy_spacer = 60
    let enemies_width = enemies.length * 50 + enemy_spacer * (enemies.length - 1);
    let enemy_offset = canvas.width / 2 - enemies_width / 2 + 25;
    for (const enemy of enemies) {
        const enemyNode = new ShipNode(false, enemy_offset, 60, enemy.hitpoints/enemy.max_hitpoints, enemy.name);
        scene.add_node(enemyNode);
        nodes_by_id[enemy.id] = enemyNode;
        locations_by_id[enemy.id] = [enemy_offset, 100];
        enemy_offset += 50 + enemy_spacer;
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
            await scaled_sleep(event.contents * 1000);
        } else if (event.type == "Damage Taken") {
            let [source_id, target_id, amount, damage_type] = event.contents;

            const target_ship = ships_by_id[target_id];
            const target_node = nodes_by_id[target_id];
            const outgoing = locations_by_id[source_id];
            const incoming = locations_by_id[target_id];

            const damage_node = new DamageNode("white", +amount.toFixed(2), incoming[0], incoming[1]);
            scene.add_node(damage_node);

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
                scene.add_node(laser);
            }
        } else if (event.type == "Item Used") {
            const [name, ship] = items_by_id[event.contents];
            print_newline_to_log();
            print_to_log(`${current_time.toFixed(2)}s ${ship.name} used ${name}`);
        } else if (event.type == "Ship Destroyed") {
            const dead_ship = ships_by_id[event.contents];
            const dead_ship_node = nodes_by_id[event.contents];
            dead_ship_node.explode()
            print_newline_to_log();
            print_to_log(`${dead_ship.name} was destroyed`);
        } else if (event.type == "Dodged") {
            let [source_id, target_id, damage_type] = event.contents;
            const target_ship = ships_by_id[target_id];
            const outgoing = locations_by_id[source_id];
            const incoming = locations_by_id[target_id];
            print_to_log(`${target_ship.name} Dodged`);
            if (damage_type == "Laser") {
                let color;
                if (source_id == ship.id) {
                    color = "green";
                } else {
                    color = "red";
                }
                let vector = new Vector2(incoming[0] + RandChoice([-30, 30]), incoming[1]);
                vector.subtract(new Vector2(outgoing[0], outgoing[1]));
                vector = vector.multiply(100)
                vector.add(new Vector2(outgoing[0], outgoing[1]));
                const laser = new LaserNode(color, outgoing[0] + RandBetween(-25, 25), outgoing[1], vector.x, vector.y);
                scene.add_node(laser);
            }
        }
        else {
            print_to_log(`${event.type} - ${event.contents}`);
        }
    }
    await scaled_sleep(4000);
    scene.stop();
}

async function combat_loop(ship) {
    const inputs_element = document.querySelector(".inputs");
    inputs_element.innerHTML = "";
    const finished = new Future();

    const on_attack = async () => {
        inputs_element.innerHTML = "";
        const enemies = await get_enemies()
        const log = await attack_ship()
        await display_combat(ship, enemies, log)
        finished.resolve()
    }

    const on_run = async () => {
        inputs_element.innerHTML = "";
        const combat_over = await run_away(ship);
        if (combat_over) {
            print_to_log("You have escaped")
        }
        finished.resolve();
    }

    const attack_button = inputs_element.appendChild(document.createElement("button"));
    attack_button.textContent = "1. Attack"
    attack_button.addEventListener("click", on_attack);

    const run_button = inputs_element.appendChild(document.createElement("button"));
    run_button.textContent = "2. Run"
    run_button.addEventListener("click", on_run)

    on_keydown = (key) => {
        if (key == '1') {
            on_attack();
        }
        else if (key == '2') {
            on_run();
        }
    };

    await finished;
}

async function non_combat_loop(ship, station) {
    on_keydown = null;

    const inputs_element = document.querySelector(".inputs");
    inputs_element.innerHTML = "";

    const finished = new Future();

    const on_buy = async () => {
        const buy_window = document.body.appendChild(document.createElement("div"));
        buy_window.classList.add("popup");
        const funds_on_hand = buy_window.appendChild(document.createElement("p"))
        funds_on_hand.textContent = `Funds available: ${ship.money}`
        const funds_icon = buy_window.appendChild(document.createElement("img"))
        funds_icon.src = "/currency.png"
        funds_icon.classList.add("funds-icon")

        funds_on_hand.classList.add("popup-window-funds")

        const hull_upgrade_button = buy_window.appendChild(document.createElement("button"))
        hull_upgrade_button.textContent = `10 hull upgrade for 10\u20A2`
        hull_upgrade_button.addEventListener("click", async () => {
            if (ship.money < 10) {
                error("Insufficient Funds");
            } else {
                upgrade_hull();
                ship.money -= 10
                funds_on_hand.textContent = `Funds available: ${ship.money}`
            }
        });

        const hull_repair_button = buy_window.appendChild(document.createElement("button"))
        hull_repair_button.textContent = `25 hull repair for 1\u20A2`
        hull_repair_button.addEventListener("click", async () => {
            if (ship.money < 1) {
                error("Insufficient Funds");
            } else if (ship.hitpoints >= ship.max_hitpoints) {
                error("Hull not damaged")
            } else {
                repair_hull();
                ship.money -= 1
                funds_on_hand.textContent = `Funds available: ${ship.money}`
                ship.hitpoints += 25;
            }
        });

        const upgrade_cargo_button = buy_window.appendChild(document.createElement("button"))
        upgrade_cargo_button.textContent = `1 additional cargo space for 5\u20A2`
        upgrade_cargo_button.addEventListener("click", async () => {
            if (ship.money < 5) {
                error("Insufficient Funds");
            } else {
                upgrade_cargo();
                ship.money -= 5
                funds_on_hand.textContent = `Funds available: ${ship.money}`
            }
        });

        const upgrade_slots_button = buy_window.appendChild(document.createElement("button"))
        upgrade_slots_button.textContent = `1 additional install space for 25\u20A2`
        upgrade_slots_button.addEventListener("click", async () => {
            if (ship.money < 25) {
                error("Insufficient Funds");
            } else {
                upgrade_install_space();
                ship.money -= 25
                funds_on_hand.textContent = `Funds available: ${ship.money}`
            }
        });


        for (const buy_item of station.sale_goods) {
            const item_button = buy_window.appendChild(document.createElement("button"))
            item_button.textContent = `${buy_item.name} for ${buy_item.buy_price}\u20A2`
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
        on_keydown = (key)=>{
            if (key == "Escape") {
                buy_window.remove();
                finished.resolve();
            }
        }
    };

    const on_sell = async () => {
        const sell_window = document.body.appendChild(document.createElement("div"));
        sell_window.classList.add("popup");
        const funds_on_hand = sell_window.appendChild(document.createElement("p"))
        funds_on_hand.textContent = `Funds available: ${ship.money}\u20A2`
        funds_on_hand.classList.add("popup-window-funds")
        for (const sell_item of ship.cargo) {
            const item_button = sell_window.appendChild(document.createElement("button"))
            item_button.textContent = `${sell_item.name} ${sell_item.serial_number} for ${sell_item.sell_price}\u20A2`
            item_button.addEventListener("click", async () => {
                item_button.remove()
                sell(sell_item.id)
                ship.money += sell_item.sell_price
                funds_on_hand.textContent = `Funds available: ${ship.money}\u20A2`
                print_newline_to_log()
                print_to_log(`sold: ${sell_item.name} ${sell_item.serial_number}`)
            });
        }

        const exit_button = sell_window.appendChild(document.createElement("button"));
        exit_button.classList.add("exit");
        exit_button.textContent = "Close";
        exit_button.addEventListener("click", async () => {
            sell_window.remove();
            finished.resolve();
        });
        on_keydown = (key)=>{
            if (key == "Escape") {
                sell_window.remove();
                finished.resolve();
            }
        }
    }


    const on_upgrade = async () => {
        const upgrade_window = document.body.appendChild(document.createElement("div"));
        upgrade_window.classList.add("popup");
        const upgrade_row = upgrade_window.appendChild(document.createElement("div"));
        upgrade_row.classList.add("row");
        upgrade_row.classList.add("item-row");

        const installable = upgrade_row.appendChild(document.createElement("div"));
        installable.classList.add("column");
        installable.classList.add("center");

        function display_installable(item) {
            const button = installable.appendChild(document.createElement("button"));
            button.textContent = `Install ${item.name} ${item.serial_number}`
            button.addEventListener("click", async () => {
                await install(item.id);
                button.remove()
                display_installed(item);
            });
        }

        function display_installed(item) {
            const button = installed.appendChild(document.createElement("button"));
            button.textContent = `Uninstall ${item.name} ${item.serial_number}`
            button.addEventListener("click", async () => {
                await uninstall(item.id);
                button.remove()
                display_installable(item);
            });
        }
        
        for (const item of ship.cargo) {
            if (item.installable) {
                display_installable(item);
            }
        }

        const installed = upgrade_row.appendChild(document.createElement("div"));
        installed.classList.add("column");
        installed.classList.add("center");
        for (const item of ship.installed_items) {
            display_installed(item);
        }
        const exit_button = upgrade_window.appendChild(document.createElement("button"));
        exit_button.classList.add("exit");
        exit_button.textContent = "Close";
        exit_button.addEventListener("click", async () => {
            upgrade_window.remove();
            finished.resolve();
        });
        on_keydown = (key)=>{
            if (key == "Escape") {
                upgrade_window.remove();
                finished.resolve();
            }
        }
    }

    const direction_map = {
        'q': 'X+', 'w': 'Y+', 'e': 'Z+',
        'a': 'X-', 's': 'Y-', 'd': 'Z-'
    };

    if (station != null){
        print_to_log("there is a station in this sector");
        print_station(station);
        const station_container = inputs_element.appendChild(document.createElement("div"));
        station_container.classList.add("station-container");
        const buy_button = station_container.appendChild(document.createElement("button"));
        buy_button.classList.add("buy");
        buy_button.textContent = "1. Buy";
        buy_button.addEventListener("click", on_buy);

        const sell_button = station_container.appendChild(document.createElement("button"))
        sell_button.classList.add("sell")
        sell_button.textContent = "2. Sell";
        sell_button.addEventListener("click", on_sell);

        const upgrade_button = station_container.appendChild(document.createElement("button"))
        upgrade_button.classList.add("upgrade")
        upgrade_button.textContent = "3. Upgrade";
        upgrade_button.addEventListener("click", on_upgrade);

        on_keydown = async (key)=>{
            if (key == "1") {
                on_buy()
            } 
            else if (key == "2") {
                on_sell()
            }
            else if (key == "3") {
                on_upgrade()
            } 
            else if (key in direction_map){
                await move_ship(direction_map[key])
                finished.resolve()
            }
        };
    } else {
        on_keydown = async (key)=>{
            if (key in direction_map) {
                await move_ship(direction_map[key])
                finished.resolve()
            }
        };
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
    name_element.classList.add("ship-info-paragraph")
    name_element.textContent = "Ship name: " + ship.name;

    const coords_element = ship_info.appendChild(document.createElement("p"));
    coords_element.classList.add("ship-info-paragraph")
    coords_element.textContent = `Coords: X:${ship.coords.x} | Y:${ship.coords.y} | Z:${ship.coords.z}`

    const hp_element = ship_info.appendChild(document.createElement("p"));
    hp_element.classList.add("ship-info-paragraph")
    hp_element.textContent = `Hull: ${+ship.hitpoints.toFixed(2)}/${ship.max_hitpoints}`;

    const money_element = ship_info.appendChild(document.createElement("p"));
    money_element.classList.add("ship-info-paragraph")
    money_element.textContent = `Funds: ${ship.money}`;
    const funds_icon = money_element.appendChild(document.createElement("img"))
    funds_icon.src = "/currency.png"
    funds_icon.classList.add("funds-icon")

    const installed_items_label = ship_info.appendChild(document.createElement("p"));
    installed_items_label.classList.add("ship-info-paragraph")
    installed_items_label.textContent = "Installed Items: " + ship.installed_items.length + "/" + ship.install_space;
    const installed_element_div = ship_info.appendChild(document.createElement("div"));
    for (const installed_item of ship.installed_items) {
        const installed_element = installed_element_div.appendChild(document.createElement("p"));
        installed_element.classList.add("ship-info-paragraph");
        installed_element.classList.add("item-list-element");
        installed_element.textContent = `- ${installed_item.name} ${installed_item.serial_number}`;
    }

    const cargo_label = ship_info.appendChild(document.createElement("p"));
    cargo_label.classList.add("ship-info-paragraph")
    cargo_label.textContent = "Cargo: " + ship.cargo.length + "/" + ship.cargo_space;
    const cargo_list_element = ship_info.appendChild(document.createElement("div"));
    for (const trade_good of ship.cargo) {
        const cargo_element = cargo_list_element.appendChild(document.createElement("p"));
        cargo_element.classList.add("ship-info-paragraph")
        cargo_element.classList.add("item-list-element");
        cargo_element.textContent = `- ${trade_good.name} ${trade_good.serial_number}`;
    }
}
  

function print_station(station) {
    print_to_log(`Station name: ${station.name}`)
    print_to_log("Goods for sale:")
    for (const trade_good of station.sale_goods) {
        print_to_log(`- ${trade_good.name} for ${trade_good.buy_price} credits`)
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
            if (ship.enemies.length == 1) {
                print_to_log(`There is a pirate in this sector!`)
            } 
            else {
                print_to_log(`There are ${ship.enemies.length} pirates in this sector!`)
            }
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