import { init as request_init } from "./request.js";
import { post_request } from "./request.js";


window.addEventListener("load", async () => {
    await request_init();
    const user = await post_request("/user/get");
    const top_level_container = document.body.appendChild(document.createElement("div"));
    const xp_counter = top_level_container.appendChild(document.createElement("p"));
    xp_counter.textContent = `XP: ${user.xp}`;

    const tech_tree_box = top_level_container.appendChild(document.createElement("button"));
    let lvl = 15;
    let xp_cost = 10;
    tech_tree_box.textContent = `LVL ${lvl}  |  1% more XP earned: ${xp_cost * lvl * .2}XP`


})