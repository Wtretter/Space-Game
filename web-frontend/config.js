export const base_url = window.location.protocol+"//"+window.location.host+"/api";



export class Setting {
    constructor(name, default_value) {
        this.name = name;
        this.default_value = default_value;

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
        return `${this.name}: ${this.value} (default: ${this.default_value})`;
    }
}

export const gamespeed = new Setting("gamespeed", 5);