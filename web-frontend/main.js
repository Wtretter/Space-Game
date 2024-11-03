const base_url = window.location.protocol+"//"+window.location.hostname+":42000";
let token = null;

async function login(username, password) {
    const response = await fetch(base_url+"/login", {
        "method": "POST",
        "body": JSON.stringify({username: username, password: password}),
        "headers": {"Content-Type": "application/json"}
    });
    return (await response.json())[1];
}

async function get_ship(){
    const response = await fetch(base_url+"/ship/get", {
        "method": "POST",
        "body": JSON.stringify({token: token}),
        "headers": {"Content-Type": "application/json"}
    });
    return await response.json();
}


window.addEventListener("load", async ()=>{
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    token = await login(username, password);

    const [ship, station] = await get_ship();
    const ship_info = document.querySelector(".ship-info");

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
});
