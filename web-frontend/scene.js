export class Node{
    /** @type {Number} */
    x;

    /** @type {Number} */
    y;

    /** @type {String} */
    color;

    constructor(color, x, y) {
        this.color = color;
        this.x = x;
        this.y = y;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) { }
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
        ctx.fillRect(this.x-50, this.y, 100 * this.health, 5);
        
        ctx.fillStyle = "white"
        ctx.textAlign = "center"
        ctx.font = "24px Jersey";
        if (this.is_player) {
            ctx.fillText(this.name, this.x, this.y+60);
        } else {
            ctx.fillText(this.name, this.x, this.y-50);
        }
        

    }
}

export class LaserNode extends Node{
    /** @type {Number} */
    target_x;

    /** @type {Number} */
    target_y;

    constructor(color, x, y, tx, ty) {
        super(color, x, y);
        this.target_x = tx;
        this.target_y = ty;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        ctx.strokeStyle = this.color
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.target_x, this.target_y)
        ctx.stroke()
    }
}

export class Scene{
    /** @type {Node[]} */
    nodes;
    /** @type {HTMLCanvasElement} */
    canvas;

    constructor(canvas) {
        this.canvas = canvas;
        this.nodes = [];
    }

    draw() {
        const ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const node of this.nodes) {
            node.draw(ctx);
        }
    }

}