export class Vector2 {
    /**@type {Number} */
    x;
    /**@type {Number} */
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    rotate(angle) {
        let x_prime = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        let y_prime = this.x * Math.sin(angle) + this.y * Math.cos(angle);
        this.x = x_prime;
        this.y = y_prime;
    }

    multiply(val) {
        return new Vector2(this.x * val, this.y * val);
    }

    distance(other_vector) {
        return Math.sqrt(Math.pow(this.x - other_vector.x, 2) + Math.pow(this.y - other_vector.y, 2));
    }

    add(other_vector) {
        this.x += other_vector.x;
        this.y += other_vector.y;
    }

    subtract(other_vector) {
        this.x -= other_vector.x;
        this.y -= other_vector.y;
    }
}