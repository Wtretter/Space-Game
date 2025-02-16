import {Sleep} from "./Async.js";
import {RandBetween} from "./utils.js";

export class Node{
    /** @type {Number} */
    x;

    /** @type {Number} */
    y;

    /** @type {String} */
    color;

    /** @type {Boolean} */
    queued_for_removal;

    /** @type {Boolean} */
    queued_for_anim;

    constructor(color, x, y) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.queued_for_removal = false;
        this.queued_for_anim = true;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) { }

    /** @param {Number} delta */
    animate(delta) { }

    remove() {
        this.queued_for_removal = true;
    }
}

export class TempNode extends Node {
    /** @type {Number} */
    lifetime;

    /** @param {Number} delta */
    animate(delta) {
        if (this.lifetime <= 0) {
            this.remove()
        }
        this.lifetime -= delta;
    }
}

export class ShipNode extends Node{

    constructor(is_player, x, y, health, name) {
        super(is_player ? "green":"red",x, y);
        this.is_player = is_player;
        this.health = health;
        this.name = name;
    }
    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x-25, this.y-40, 50, 80);

        ctx.fillStyle = "grey";
        ctx.fillRect(this.x-52, this.y-2, 104, 9);

        ctx.fillStyle = "red";
        ctx.fillRect(this.x-50, this.y, 100 * Math.max(this.health, 0), 5);
        
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "24px Jersey";
        if (this.is_player) {
            ctx.fillText(this.name, this.x, this.y+60);
        } else {
            ctx.fillText(this.name, this.x, this.y-50);
        }
        

    }
}

export class DamageNode extends TempNode{
    /** @type {Number} */
    amount;
    /** @type {Number} */
    opacity;

    constructor(color, amount, x, y){
        super(color, x + RandBetween(-25, 25), y + RandBetween(-25, 25));
        this.amount = amount;
        this.lifetime = 1200;
        this.opacity = 1;
    }
    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx){
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "16px Jersey"; 
        ctx.globalAlpha = Math.max(this.opacity, 0)
        ctx.fillText(this.amount, this.x, this.y)
        ctx.globalAlpha = 1.0
    }
    /** @param {Number} delta */
    animate(delta) {
        super.animate(delta);
        this.opacity -= delta * 0.001
    }
}
export class LaserNode extends TempNode{
    /** @type {Number} */
    target_x;

    /** @type {Number} */
    target_y;

    constructor(color, x, y, tx, ty) {
        super(color, x, y);
        this.target_x = tx;
        this.target_y = ty;
        this.lifetime = 1;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.target_x, this.target_y);
        ctx.stroke();
    }
}

export class Scene{
    /** @type {Node[]} */
    nodes;
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {Boolean} */
    running;
    /** @type {Number} */
    max_fps;

    constructor(canvas) {
        this.canvas = canvas;
        this.nodes = [];
        this.running = false;
        this.max_fps = 60;
    }
    
    draw() {
        const ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const node of this.nodes) {
            node.draw(ctx);
        }
    }

    start() {
        this.running = true;
        this.animate();
    }

    async animate() {
        let prev_time = performance.now();
        while (this.running) {
            const curr_time = performance.now();
            const delta = curr_time - prev_time;
            const frame_length = 1000/this.max_fps
            for (const node of this.nodes) {
                if (node.queued_for_removal) {
                    this.nodes.splice(this.nodes.indexOf(node), 1);
                }
                if (node.queued_for_anim) {
                    node.animate(0);
                    node.queued_for_anim = false;
                } else {
                    node.animate(delta);
                }
            }
            this.draw()
            if (delta < frame_length) {
                await Sleep(frame_length - delta);
            }
            prev_time = curr_time;
        }
    }

    stop() {
        this.running = false
    }
}