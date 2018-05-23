'use strict';
/* global fetch */
import { Frame } from './frame.js';

console.info('### Enable the \'Verbose\' log level to see debug messages. ###');

/**
 * Promise for when the DOM is ready.
 * This is equivalent to $(function() {}), as well as document.addEventListener('DOMContentLoaded', function() {}).
 *
 * @type {Promise<void>}
 */
document.readyStateInteractive = new Promise((resolve) => {

    const finish = () => {
        console.debug('Document readyState changed to "interactive", resolving promise.');
        resolve();
    };

    // Make sure we listen on the load event to resolve the promise
    document.addEventListener('readystatechange', () => {
        if (document.readyState === "interactive") {
            finish();
        }
    });

    // Also check that the event hasn't fired already by checking the readyState
    if (document.readyState === "interactive") {
        finish();
    }
});

/**
 * Promise for when loading the page is fully complete as far as the browser is concerned.
 * This is equivalent to window.onload, as well as window.addEventListener('load', function() {}).
 *
 * @type {Promise<void>}
 */
document.readyStateComplete = new Promise((resolve) => {

    const finish = () => {
        console.debug('Document readyState changed to "complete", resolving promise.');
        resolve();
    };

    // Make sure we listen on the load event to resolve the promise
    document.addEventListener('readystatechange', () => {
        if (document.readyState === "complete") {
            finish();
        }
    });

    // Also check that the event hasn't fired already by checking the readyState
    if (document.readyState === "complete") {
        finish();
    }
});

export class Router {
    static getLanguage() {
        var lang = localStorage.getItem("wpui:language");
        if (lang)
            return lang;
        else return "en";
    }
    static setLanguage(lang) {
        localStorage.setItem("wpui:language", lang);
    }
    constructor() {
        /**
         * Key/value pairs from page name to frame name to override the default frame. Used in subclass.
         *
         * @type {{string: string}}
         */
        this.frameOverrides = {};

        this._scriptLoadingPromises = new Set();

        if (arguments[0]) {
            this.frame = arguments[0];
        }
        if (arguments[1]) {
            this.homePage = arguments[1];
        }
        else {
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
            this._container = arguments[4];
        }
        else {
            this._container = document.body;
        }
        if (arguments[5]) {
            this.headers = arguments[5];
        }
        else {
            this.headers = this.constructor.getHeaders();
        }
        this.headersContainer.Router = this;
        this.catchNavigation = true;
        window.addEventListener("popstate", () => {
            this.setPageFromUrl(window.location.pathname, true);
        });

        /**
         * Promise to indicate that WPUI router is done doing stuff to the DOM.
         * Use this rather than DOMReady (readyStateInteractive) to ensure any routing business is done.
         *
         * @type {Promise<void>}
         */
        this.wpuiDOMActionsFinished = document.readyStateInteractive.then(() => {

            return this.doDOMActions();
        });

        console.debug('Router constructor done.');
    }

    /**
     * Returns a promise that resolves when all known scripts have been loaded
     *
     * @returns {Promise<[void]>}
     */
    get allScriptsLoaded() {
        console.debug('Called allScriptsLoaded');

        return Promise.all(this._scriptLoadingPromises);
    }

    /**
     * Adds an array of script loading promises to the store
     *
     * @param arr
     */
    addScriptLoadingPromises(arr) {
        for (const p of arr) {
            this._scriptLoadingPromises.add(p);
        }
    }

    get headersContainer() {
        if (this._container === document.body) {
            return document.getElementsByTagName("head")[0];
        }
        else {
            return this._container;
        }
    }

    get container() {
        return this._container;
    }

    /**
     * Execute domActions
     */
    doDOMActions() {
        console.debug('Called doDOMActions');

        return Router.preventOriginalScriptsExec()
            .then(() => this.loadHeaders());
    }

    /**
     * Attempts to execute a script and returns a Promise for when it is done executing
     *
     -
     * @param script
     * @returns Promise
     */
    executeScript(script) {
        console.debug('Checking script: ', script);

        // Check whether the script has already been made to execute somehow before
        if ('loadPromise' in script) {
            return script.loadPromise;
        }

        // Scripts that were added normally don't execute (?).
        // Instead, we need to copy the source over into an actual script element.
        const script2 = document.createElement('script');

        console.debug('Executing script: ', script);
        try {
            // The below code might be better if we can get it to work.
            // if (script.src) {
            //     console.log('Using module');
            //     ret = import(script.src);
            // }
            // else if (script.type !== "module") {
            //     ret = new Promise((resolve) => {
            //         console.warn("Using eval");
            //         eval(script.innerHTML);
            //         resolve();
            //     });
            // }

            // Before we do anything with this script, we set its onload event to mark the script as executed.
            script2.loadPromise = new Promise((resolve) => {
                script2.onload = resolve;
            }).then(() => {
                console.debug('Script execution promise resolving, total: ', this._scriptLoadingPromises);
            });

            // Copy the script contents (url) and append the element.
            script2.src = script.src;
            this.headersContainer.appendChild(script2);

        }
        catch (ex) {
            console.error(ex, script);
        }
        return script2.loadPromise;
    }

    static getHeaders() {
        return [
            "<script src=\"https:\/\/ajax.googleapis.com\/ajax\/libs\/jquery\/3.3.1\/jquery.min.js\"><\/script>",
            "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/js/materialize.min.js\"><\/script>",
            '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/css/materialize.min.css">',
        ];
    }

    /**
     * Formerly WPUIglobalEval. Checks and evaluates any new scripts, and returns a promise when they have been loaded.
     *
     * @returns {Promise<void>}
     * @constructor
     */
    checkScripts() {
        console.debug('Called checkScripts');

        // Be sure that when we are here, our after-DOM-loaded tasks are done
        return this.wpuiDOMActionsFinished.then(() => {

            // Get all the scripts
            const scripts = Array.from(document.getElementsByTagName("script"));

            // Get the promises for all the scripts to run
            this.addScriptLoadingPromises(scripts.map((script) => this.executeScript(script)));

            // Return a promise that resolves when all the scripts finish running
            const finish = () => {
                console.debug('checkScripts promise being resolved');
            };
            return this.allScriptsLoaded.then(finish);
        });
    };

    /**
     * Prevent any scripts that are already in the document from being executed twice by marking them.
     */
    static preventOriginalScriptsExec() {
        console.debug('Called preventOriginalScriptsExec');

        return new Promise((resolve) => {
            // Be sure that when we are here, the DOM (so all script tags) has been interpreted
            document.readyStateInteractive.then(() => {

                // Get all the scripts
                const scripts = Array.from(document.getElementsByTagName("script"));

                // Mark all scripts we can find right now as already executed by the browser.
                scripts.forEach((script) => {
                    console.debug('Setting script as executed already: ', script);

                    // We don't know when the script will load but probably it'll be ok.
                    // A script is marked as 'already handled' when it has a loadPromise.
                    script.loadPromise = Promise.resolve();
                });

                resolve();
            });
        });
    }

    getPageFromURL(requestedPath) {
        console.debug('Called getPageFromURL');

        requestedPath = requestedPath.replace("/" + this.basePath, "");
        requestedPath = requestedPath.replace(this.basePath + "/", "");
        requestedPath = requestedPath.trim();
        if (requestedPath.indexOf("/") === 0) {
            requestedPath = requestedPath.substr(1, requestedPath.length - 1);
        }
        const slashSplits = requestedPath.split("/");
        let actualPage = slashSplits[slashSplits.length - 1];
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

    setPageFromUrl(url, noPush) {
        console.debug('Called setPageFromURL');

        const actualPage = this.getPageFromURL(url);
        const frameForPage = this.frameForPage(actualPage);
        if (frameForPage !== this.currentFrameName) {
            this.routeTo(actualPage);
        }
        else {
            this.currentFrameObject.setPage(actualPage);
        }

        const stateObj = {
            page: actualPage
        };
        if (noPush === undefined || !noPush) {
            window.history.pushState(stateObj, actualPage, url);
        }
    }

    frameForPage(page) {
        return (page in this.frameOverrides) ? this.frameOverrides[page] : this.frame;
    }

    framePath(frame) {
        return this.basePath + "/frames/" + frame + "/" + frame + "." + this.defaultFileExtension;
    }

    route() {
        console.debug('Called route');

        // Wait for scripts. Not sure if we can proceed, but it seems to break things.
        this.allScriptsLoaded.then(() => {
            const actualPage = this.getPageFromURL(document.location.pathname.replace("/" + this.basePath + "/", ""));
            this.routeTo(actualPage);
        });
    }

    routeTo(page) {
        console.debug('Called routeTo');

        // Wait for scripts. Not sure if we can proceed, but it seems to break things.
        this.allScriptsLoaded.then(() => {
            const frameName = this.frameForPage(page);
            const framePath = this.framePath(frameName);
            const me = this;
            import (document.location.origin + "/" + framePath)
            .then(({ default: frameBase }) => {
                const frame = new frameBase(me.basePath);
                me.currentFrameObject = frame;
                me.currentFrameName = frameName;
                frame.addOnPartLoadedHandlers(me, me.framePartLoaded);
                me.clearContainer();

                frame.getContent().then(html => {
                    console.debug('Frame.getContent finished.');

                    const div = document.createElement('div');
                    div.innerHTML = html.trim();

                    for (let i = div.childNodes.length; i > 0; i--) {
                        me.container.appendChild(div.childNodes[0]);
                    }

                    // Wait for all the document to finish loading.
                    // Note that we waited for scripts all they way at the top of route().
                    document.readyStateComplete.then(() => {
                        console.debug('Calling Frame.onLoaded');
                        frame.onLoaded();
                        frame.setPage(page);
                    });
                });
            });
        });
    }

    /**
     * Runs after the frame has loaded some stuff.
     */
    framePartLoaded() {
        console.debug('Called framePartLoaded');

        console.debug('Calling checkScripts from framePartLoaded');
        // noinspection JSIgnoredPromiseFromCall
        this.checkScripts();

        if (this.catchNavigation) {

            const me = this;
            const ls = document.links,
                numLinks = ls.length;
            for (let i = 0; i < numLinks; i++) {
                var href = ls[i].href;
                if (href.indexOf("/#") == -1) {
                    ls[i].onclick = function() {
                        if (this.hostname !== document.location.hostname) {
                            return true;
                        }
                        try {
                            me.setPageFromUrl(this.pathname);
                            return false;
                        }
                        catch (ex) {
                            return true;
                        }


                    };
                }
            }
        }
        this.currentFrameObject.loadElements();
    }

    clearContainer() {
        console.debug('Called clearContainer');

        this._container.innerHTML = "";
        if (this._container !== document.body) {
            this.loadHeaders();
        }
    }

    /**
     * Takes links in html-format from a list and places them in the header (or another container)
     */
    loadHeaders() {
        console.debug('Called loadHeaders');


        const newScriptPromises = [];
        this.headers.forEach((h) => {

            // Create a dummy element
            const div = document.createElement('div');
            // Make the browser parse the html code in h, by adding it into the dummy.
            div.innerHTML = h.trim();
            // Now we have an element object for the header. Assume the html was just one element.
            const element = div.firstChild;

            if (element && element.src) {

                // If the element is a script, we need to do stuff.
                newScriptPromises.push(this.executeScript(element));
            }
            else {

                // For stylesheets and such just add it.
                this.headersContainer.appendChild(element);
            }
        });
        this.addScriptLoadingPromises(newScriptPromises);
    }

    fetchURL(url, callback) {
        console.debug('Called fetchURL');

        fetch(url)
            .then((response) => response.text())
            .then((html) => callback(html));
    }
}
