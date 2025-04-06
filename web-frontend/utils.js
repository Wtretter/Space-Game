export function RandBetween(min, max) {
    return (max - min) * Math.random() + min
}

/** @param {Array} list */
export function RandChoice(list) {
    return list[Math.round(RandBetween(0, list.length))];
}