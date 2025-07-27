import { post_request } from "./request.js";

export class Settings {
    constructor() {
        this.animation_speed = 10;
        this.piracy = "ON";
    }

    async load() {
        const settings = await post_request("/settings/get")
        this.animation_speed = settings.animation_speed;
        this.piracy = settings.piracy;
    }

    async save() {
        await post_request("/settings/update", {settings: {
            animation_speed: this.animation_speed, 
            piracy: this.piracy,
        }})
    }
}

export let settings = new Settings();

export async function init() {
    await settings.load();
}