'use strict';
/* global fetch */
import {Frame} from './frame.js';

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
    constructor() {

        /**
         * Actions to do to the DOM as soon as it is loaded (readyStateInteractive)
         *
         * @type {function[]}
         */
        this.domActions = [Router.preventOriginalScriptsExec];

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
            this.headers = this.constructor.getHeaders();
        }
        this.headersLoaded    = false;
        this.container.Router = this;
        this.catchNavigation  = true;
        this.loadHeaders();
        window.addEventListener("popstate", () => {
            this.setPageFromUrl(window.location.pathname, true);
        });

        /**
         * Promise to indicate that WPUI router is done doing stuff to the DOM.
         * Use this rather than DOMReady (readyStateInteractive) to ensure any routing business is done.
         *
         * @type {Promise<void>}
         */
        this.wpuiDOMActionsFinished = new Promise((resolve => {
            document.readyStateInteractive.then(() => {
                this.doDOMActions();
                resolve();
            })
        }));

        console.debug('Router constructor done.');
    }

    /**
     * Execute domActions
     */
    doDOMActions() {
        this.domActions.forEach((f) => f());
    }

    /**
     * Attempts to execute a script and returns a Promise for when it is done executing
     *
     -
     * @param script
     * @returns Promise
     */
    executeScript(script) {
        let ret = null;

        console.debug('Checking script: ', script);

        if (!script._setToExecute) {
            console.debug('Executing script: ', script);
            try {
                if (script.src) {
                    ret = import(script.src);
                }
                else if (script.type !== "module") {
                    ret = new Promise((resolve) => {
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

        console.log('called checkScripts');

        // Be sure that when we are here, our after-DOM-loaded tasks are done
        return this.wpuiDOMActionsFinished.then(() => {

            // Get all the scripts
            const scripts = Array.from(document.getElementsByTagName("script"));

            // Get the promises for all the scripts to run
            const scriptPromises = scripts.map((script) => this.executeScript(script));

            // Return a promise that resolves when all the scripts finish running
            const finish = () => {
                console.log('checkScripts promise being resolved');
            };
            return Promise.all(scriptPromises).then(finish);
        });
    };

    /**
     * Prevent any scripts that are already in the document from being executed twice by marking them.
     */
    static preventOriginalScriptsExec() {
        console.debug('Called preventOriginalScriptsExec');

        // Be sure that when we are here, the DOM (so all script tags) has been interpreted
        document.readyStateInteractive.then(() => {

            // Get all the scripts
            const scripts = Array.from(document.getElementsByTagName("script"));

            // Mark all scripts we can find right now as already executed by the browser.
            scripts.forEach((script) => {
                console.debug('Setting script as executed already: ', script);
                script._setToExecute = true;
            });
        });
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

    setPageFromUrl(url, noPush) {
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
            window.setTimeout(() => this.directRoute(), 1);
        }
    }

    directRoute() {
        console.log('directRoute');
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
                    console.debug('Frame.getContent finished.');

                    const div     = document.createElement('div');
                    div.innerHTML = html.trim();

                    // Change this to div.childNodes to support multiple top-level nodes
                    for (let i = 0; i < div.childNodes.length; i++) {
                        const element = div.childNodes[i];
                        me.container.appendChild(element);
                    }

                    // Wait for all scripts to have loaded
                    console.debug('Calling checkScripts from directRoute');
                    const scriptsReady = me.checkScripts();
                    Promise.all([scriptsReady, document.readyStateComplete]).then(() => {
                        console.debug('Calling Frame.onLoaded');
                        frame.onLoaded();
                        frame.setPage(actualPage);
                    });
                });
            });
    }

    /**
     * Runs after the frame has loaded some stuff.
     */
    framePartLoaded() {

        console.debug('Calling checkScripts from framePartLoaded');
        // noinspection JSIgnoredPromiseFromCall
        this.checkScripts();

        if (this.catchNavigation) {
            const me = this;
            const ls = document.links, numLinks = ls.length;
            for (let i = 0; i < numLinks; i++) {
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
                    if (Router.checkHeadersLoaded()) {
                        me.headersLoaded = true;
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

    static checkHeadersLoaded() {
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