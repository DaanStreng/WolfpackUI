'use strict';
/* global fetch */
import {Frame} from './frame.js';

document.markOriginalScriptsAsExecuted = () => {
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
        console.log(scripts[i]);
        scripts[i]._setToExecute = true;
    }
};

const domReady = new Promise((resolve) => {
    // expose fulfilled state holder to outer scope
    document.addEventListener('DOMContentLoaded', resolve);
});

const postDomReady = new Promise((resolve => {
    domReady.then(() => {
        document.markOriginalScriptsAsExecuted();
        resolve();
    })
}));

// A Promise for window.onload
const loadReady = new Promise((resolve) => {
    // expose fulfilled state holder to outer scope
    document.addEventListener('load', resolve);
});

/**
 * Attempts to execute a script and returns a Promise for when it is done executing
 *
 -
 * @param script
 * @returns Promise
 */
document.executeScript = (script) => {
    let ret = null;
    console.log(script);
    if (!script._setToExecute) {
        try {
            if (script.src) {
                ret = import(script.src);
            }
            else if (script.type !== "module") {
                ret = new Promise((resolve, reject) => {
                    eval(script.innerHTML);
                    resolve();
                });
            }
        }
        catch (ex) {
            console.error(ex, script);
        }
        script._setToExecute = true;
    }
    return ret;
};

document.WPUIglobalEval = () => {

    // Be sure that when we are here, our after-DOM-loaded tasks are done
    return postDomReady.then(() => {

        // Get all the scripts
        const scripts = Array.from(document.getElementsByTagName("script"));

        // Get the promises for all the scripts to run
        const scriptPromises = scripts.map((script) => document.executeScript(script));

        // Return a promise that resolves when all the scripts finish running
        return Promise.all(scriptPromises);
    });
};

export class Router {
    constructor() {
        const me2     = this;
        const scripts = document.getElementsByTagName("script");
        for (let i = 0; i < scripts.length; i++) {
            scripts[i]._setToExecute = true;
            const checkLocalLoad     = function() {
                scripts[i]._setToExecute = true;
                me2.checkHeadersLoaded();
            };
            scripts[i].onload        = checkLocalLoad();
            window.setTimeout(checkLocalLoad, 1000);
        }

        if (arguments[0]) {
            this.frame = arguments[0];
        }
        if (arguments[1]) {
            this.homePage = arguments[1];
        } else {
            this.homePage = "home";
        }
        if (arguments[2]) {
            this.basePath = arguments[2];
        }
        else {
            this.basePath = "";
        }

        if (arguments[3]) {
            this.defaultFileExtension = arguments[3];
            if (this.defaultFileExtension.indexOf(".") === 0) {
                this.defaultFileExtension = this.defaultFileExtension.substr(1, this.defaultFileExtension.length - 1);
            }
        }
        else {
            this.defaultFileExtension = "js";
        }
        if (arguments[4]) {
            this.container = arguments[4];
        } else {
            this.container = document.body;
        }
        if (arguments[5]) {
            this.headers = arguments[5];
        } else {
            this.headers = [
                "<script src=\"https:\/\/ajax.googleapis.com\/ajax\/libs\/jquery\/3.3.1\/jquery.min.js\"><\/script>",
                "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/js/materialize.min.js\"><\/script>",
                '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/css/materialize.min.css">',

            ]
        }
        this.headersLoaded    = false;
        this.baseURL          = document.location.hostname + this.basePath;
        this.container.Router = this;
        this.catchNavigation  = true;
        this.loadHeaders();
        const me = this;
        window.addEventListener("popstate", () => {
            me.SetPageFromUrl(window.location.pathname, true);
        });
        console.log('constructor done');
    }

    get Container() {
        return this.container;
    }

    getPageFromURL(requestedPath) {

        requestedPath = requestedPath.replace("/" + this.basePath, "");
        requestedPath = requestedPath.replace(this.basePath + "/", "");
        requestedPath = requestedPath.trim();
        if (requestedPath.indexOf("/") === 0) {
            requestedPath = requestedPath.substr(1, requestedPath.length - 1);
        }
        const slashSplits = requestedPath.split("/");
        let actualPage    = slashSplits[slashSplits.length - 1];
        if (actualPage.trim().length === 0) {
            if (slashSplits.length > 1) {
                actualPage = slashSplits[slashSplits.length - 2];
            }
            else {
                actualPage = this.homePage;
            }
        }
        return actualPage;
    }

    SetPageFromUrl(url, noPush) {
        const actualPage = this.getPageFromURL(url);
        this.currentFrame.setPage(actualPage);
        const stateObj = {
            page: actualPage
        };
        if (noPush === undefined || !noPush) {
            window.history.pushState(stateObj, actualPage, url);
        }
    }

    Route() {
        if (this.headersLoaded) {
            this.directRoute();
        }
        else {
            const me = this;
            window.setTimeout(() => me.directRoute(), 1);
        }
    }

    directRoute() {
        const actualPage = this.getPageFromURL(document.location.pathname.replace("/" + this.basePath + "/", ""));
        const framePath  = this.basePath + "/frames/" + this.frame + "/" + this.frame + "." + this.defaultFileExtension;
        const me         = this;
        import (document.location.origin + "/" + framePath)
            .then(({default: frameBase}) => {
                const frame     = new frameBase(me.basePath);
                me.currentFrame = frame;
                frame.addOnPartLoadedHandlers(me, me.framePartLoaded);
                me.clearContainer();

                frame.getContent().then(html => {
                    const div     = document.createElement('div');
                    div.innerHTML = html.trim();
                    // Change this to div.childNodes to support multiple top-level nodes
                    for (let i = 0; i < div.childNodes.length; i++) {
                        const element = div.childNodes[i];
                        me.container.appendChild(element);
                    }

                    // Wait for all scripts to have loaded
                    Promise.all([document.WPUIglobalEval(), loadReady]).then(() => {
                        frame.onLoaded();
                        frame.setPage(actualPage);
                    });
                });
            });
    }

    framePartLoaded() {

        document.WPUIglobalEval();

        if (this.catchNavigation) {
            const me = this;
            const ls = document.links, numLinks = ls.length;
            for (let i = 0; i < numLinks; i++) {
                ls[i].onclick = function() {
                    if (this.hostname !== document.location.hostname) {
                        return true;
                    }
                    try {
                        me.SetPageFromUrl(this.pathname);
                        return false;
                    }
                    catch (ex) {
                        return true;
                    }

                };
            }
        }
        this.currentFrame.loadElements();
    }

    clearContainer() {
        this.container.innerHTML = "";
        if (this.container !== document.body) {
            this.loadHeaders();
        }
    }

    loadHeaders() {
        const me              = this;
        let containingElement = this.container;
        if (this.container === document.body) {
            containingElement = document.getElementsByTagName("head")[0];
        }
        for (let i = 0; i < this.headers.length; i++) {

            const div     = document.createElement('div');
            div.innerHTML = this.headers[i].trim();
            const element = div.firstChild;
            // Change this to div.childNodes to support multiple top-level nodes
            if (element && element.src) {
                const script  = document.createElement('script');
                script.onload = function() {
                    this._setToExecute = true;
                    if (me.checkHeadersLoaded()) {
                        me.headersLoaded = true;
                        if (me.onHeadersLoaded != null) {
                            me.onHeadersLoaded();
                        }
                    }
                };
                script.src    = element.src;
                containingElement.appendChild(script);
            }
            else {
                containingElement.appendChild(element);
            }
        }
    }

    checkHeadersLoaded() {
        const tags = document.getElementsByTagName("script");
        for (let i = 0; i < tags.length; i++) {
            if (!tags[i]._setToExecute) {
                return false;
            }
        }
        return true;
    }

    fetchURL(url, callback) {
        fetch(url)
            .then((response) => response.text())
            .then((html) => callback(html));
    }
}