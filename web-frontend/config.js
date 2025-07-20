export class Setting {
    constructor(name, default_value) {
        this.name = name;
        this.default_value = default_value;
        this._value = null;
    }

    load() {
        let value;
        try {
            value = JSON.parse(localStorage.getItem(this.name));
            if (value == null) {
                throw Error();
            }
        } catch {
            value = this.default_value;
        }
        this._value = value;
    }

    get value() {
        return this._value;
    }

    set value(obj) {
        this._value = obj;
        localStorage.setItem(this.name, JSON.stringify(obj));
    }

    show() {
        return `${this.name}: (default: ${this.default_value})`;
    }
}

export let animation_speed = new Setting("Animation Speed", 10);
export let pirates_on = new Setting("Pirates", "ON");

export function init() {
    animation_speed.load();
    pirates_on.load();
}