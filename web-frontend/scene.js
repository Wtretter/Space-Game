import {Sleep} from "./Async.js";
import {RandBetween} from "./utils.js";
import {Vector2} from "./vector.js";
import {gamespeed} from "./config.js"


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

    /** @type {Scene} */
    parent_scene;

    constructor(color, x, y) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.queued_for_removal = false;
        this.queued_for_anim = true;
        this.parent_scene = null;
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
        ctx.font = "20px Jersey";
        if (this.is_player) {
            ctx.fillText(this.name, this.x, this.y+55);
        } else {
            ctx.fillText(this.name, this.x, this.y-45);
        }
    }
    explode() {
        for (let x = 0; x < 50; x += 5) {
            for (let y = 0; y < 80; y += 5) {
                const trajectory = new Vector2(Math.random() * 20 + 15, 0)
                trajectory.rotate(Math.random() * 2 * Math.PI)
                const square = new ShipDebris(this.color, this.x - 25 + x, this.y - 40 + y, trajectory, new Vector2(this.x, this.y))
                this.scene.add_node(square)
            }
        }
        this.remove()
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

class ShipDebris extends TempNode{
    /** @type {Vector2} */
    trajectory;
    /** @type {Vector2} */
    ship_vector;

    constructor(color, x, y, trajectory, ship_vector) {
        super(color, x, y);
        this.trajectory = trajectory;
        this.lifetime = 10000;
        this.ship_vector = ship_vector;
    }

    /** @param {Number} delta */
    animate(delta) {
        super.animate(delta);
        const deltaTrajectory = this.trajectory.multiply(delta / 1000);
        this.x += deltaTrajectory.x;
        this.y += deltaTrajectory.y;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx){
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max((100 - this.ship_vector.distance(new Vector2(this.x, this.y))) / 20, 0);
        ctx.fillRect(this.x, this.y, 5, 5);
        ctx.globalAlpha = 1.0
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

    /** @param {Node} node */
    add_node(node) {
        this.nodes.push(node);
        node.scene = this;
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
                    node.animate(delta * (gamespeed.value/10));
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