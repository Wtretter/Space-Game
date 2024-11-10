/**
 * Copyright 2022-2024 Benjamin Miramontes
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the “Software”),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

export class Future {
    promise;
    resolve_callback;
    reject_callback;
    constructor() {
        const self = this;
        self.promise = new Promise((resolve, reject) => {
            self.resolve_callback = resolve;
            self.reject_callback = reject;
        });
    }
    resolve(value) {
        this.resolve_callback(value);
    }
    reject(reason) {
        this.reject_callback(reason);
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
}

export class TimedFuture extends Future {
    timeoutId;
    constructor(timeout) {
        super();
        const self = this;
        self.timeoutId = setTimeout(() => {
            self.reject(new Error("timeout"));
        }, timeout);
    }
    resolve(value) {
        clearTimeout(this.timeoutId);
        super.resolve(value);
    }
    reject(reason) {
        clearTimeout(this.timeoutId);
        super.reject(reason);
    }
}

export async function Sleep(timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
}
