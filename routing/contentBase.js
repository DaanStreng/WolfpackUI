'use strict';
/* global fetch */
import {
    Router
}
from './router.js'
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
                    me.localize(text).then(function(result) {
                        me.loadedContent = result;
                        resolve(result);
                    });

                });
        });

    }
    localize(text) {
        var me = this;
        return new Promise(function(resolve, reject) {
            if (text.indexOf("@{") == -1) {
                resolve(text);
                return;
            }
            var languageFile = me.contentFile.substr(0, me.contentFile.lastIndexOf("/"));
            languageFile += "/localization.json";
           
            fetch(languageFile)
                .then(function(response) {
                    return response.json();
                }).then(function(data) {
                    var language = Router.getLanguage();
                    var def = data.default;
                    data = data[language];
                    while (text.indexOf("@{") != -1) {
                        var fromString = text.substr(text.indexOf("@{"));
                        fromString = fromString.substr(0, fromString.indexOf("}@") + 2);
                        var content = fromString.substr(2, fromString.length - 4);
                        console.log(content);
                        var fillIn = data[content];
                        if (fillIn) {
                            text = text.replace(fromString, fillIn);
                        }
                        else {
                            if(def && def[content]){
                                text = text.replace(fromString, def[content]);
                            }else
                            text = text.replace(fromString, content);
                        }
                    }
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
