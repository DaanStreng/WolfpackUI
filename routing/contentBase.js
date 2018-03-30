'use strict';
/* global fetch */
export class ContentBase {
    constructor() {
        this.onPartLoadedHandlers = [];
    }

    getContent() {
        var me = this;
        return new Promise(function(resolve, reject) {
            fetch(me.contentFile)
                .then(function(response) {
                    return response.text();
                }).then(function(text) {
                    me.loadedContent = text;
                    resolve(text);
                });
        });

    }

    onLoaded() {
        this.onPartLoaded();
    }
    onPartLoaded() {
        this.onPartLoadedHandlers.forEach(function(callbackObject) {
            callbackObject.func.call(callbackObject.caller);
        });
    }
    addOnPartLoadedHandlers(caller, callback) {
        this.onPartLoadedHandlers.push({
            caller: caller,
            func: callback
        });
    }
}
