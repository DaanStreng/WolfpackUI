'use strict';
/* global fetch */
import {
    Frame
}
from './frame.js';

document.WPUIglobalEval = function() {
    var scripts = document.getElementsByTagName("script");

    for (var i = 0; i < scripts.length; i++) {
        if (!scripts[i]._executed2) {
            try {
                if (scripts[i].src) {
                    import (scripts[i].src);
                }
                else if (scripts[i].type != "module") {
                    eval(scripts[i].innerHTML);
                }
            }
            catch (ex) {
                console.error(ex, scripts[i]);
            }
            scripts[i]._executed2 = true;
        }
    }
}



export class Router {
    static getLanguage(){
        var lang = localStorage.getItem("wpui:language");
        if (lang)
            return lang;
        else return "en";
    }
    static setLanguage(lang){
        localStorage.setItem("wpui:language",lang);
    }
    constructor() {
        var me2 = this;
     
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            scripts[i]._executed2 = true;
            var checkLocalLoad = function() {
                scripts[i]._executed2 = true;
                me2.checkHeadersLoaded();
            }
            scripts[i].onload = checkLocalLoad();
            window.setTimeout(checkLocalLoad, 1000);
        }


        if (arguments[0])
            this.frame = arguments[0];
        if (arguments[1])
            this.homePage = arguments[1];
        else
            this.homePage = "home";
        if (arguments[2]) {
            this.basePath = arguments[2];
        }
        else this.basePath = "";

        if (arguments[3]) {
            this.defaultFileExtension = arguments[3];
            if (this.defaultFileExtension.indexOf(".") == 0) {
                this.defaultFileExtension = this.defaultFileExtension.substr(1, this.defaultFileExtension.length - 1);
            }
        }
        else
            this.defaultFileExtension = "js";
        if (arguments[4])
            this.container = arguments[4];
        else this.container = document.body;
        if (arguments[5])
            this.headers = arguments[5];
        else {
            this.headers = [
                "<script src=\"https:\/\/ajax.googleapis.com\/ajax\/libs\/jquery\/3.3.1\/jquery.min.js\"><\/script>",
                "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/js/materialize.min.js\"><\/script>",
                '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/css/materialize.min.css">',

            ]
        }
        this.headersLoaded = false;
        this.baseURL = document.location.hostname + this.basePath;
        this.container.Router = this;
        this.catchNavigation = true;
        this.loadHeaders();
        var me = this;
        window.addEventListener("popstate", function(e) {
            me.SetPageFromUrl(window.location.pathname, true);
        });

    }

    get Container() {
        return this.container;
    }
    getPageFromURL(requestedPath) {

        requestedPath = requestedPath.replace("/" + this.basePath, "");
        requestedPath = requestedPath.replace(this.basePath + "/", "");
        requestedPath = requestedPath.trim();
        if (requestedPath.indexOf("/") == 0) {
            requestedPath = requestedPath.substr(1, requestedPath.length - 1);
        }
        var slashSplits = requestedPath.split("/");
        var actualPage = slashSplits[slashSplits.length - 1];
        if (actualPage.trim() == 0) {
            if (slashSplits > 1) {
                actualPage = slashSplits[slashSplits.length - 2];
            }
            else {
                actualPage = this.homePage;
            }
        }
        return actualPage;
    }
    SetPageFromUrl(url, noPush) {
        var actualPage = this.getPageFromURL(url);
        this.currentFrame.setPage(actualPage);
        var stateObj = {
            page: actualPage
        };
        if (noPush == undefined || !noPush)
            window.history.pushState(stateObj, actualPage, url);
    }
    Route() {
        if (this.headersLoaded) {
            this.directRoute();
        }
        else {
            var me = this;
            var timesTried = 0;
            var interval = window.setInterval(function() {
                if (me.checkHeadersLoaded() || timesTried >= 10) {
                    window.clearInterval(interval);
                    me.directRoute();
                }
                timesTried++;
            }, 10);
        }
    }
    directRoute() {
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++) {
            scripts[i]._executed = true;
        }
        var actualPage = this.getPageFromURL(document.location.pathname.replace("/" + this.basePath + "/", ""));
        var framePath = this.basePath + "/frames/" + this.frame + "/" + this.frame + "." + this.defaultFileExtension;
        var me = this;
        import (document.location.origin + "/" + framePath).then(({
            default: frameBase
        }) => {
            var frame = new frameBase(me.basePath);
            me.currentFrame = frame;
            frame.addOnPartLoadedHandlers(me, me.framePartLoaded);
            me.clearContainer();

            frame.getContent().then(html => {
                //me.container.innerHTML = me.container.innerHTML + html;
                var div = document.createElement('div');
                div.innerHTML = html.trim();
                // Change this to div.childNodes to support multiple top-level nodes
                for (var i = 0; i < div.childNodes.length; i++) {
                    var element = div.childNodes[i];
                    me.container.appendChild(element);
                }

                document.WPUIglobalEval();
                frame.onLoaded();
                frame.setPage(actualPage);

            });

        });
    }

    framePartLoaded() {

        document.WPUIglobalEval();

        if (this.catchNavigation) {
            var me = this;
            for (var ls = document.links, numLinks = ls.length, i = 0; i < numLinks; i++) {
                var href = ls[i].href;
                if (href.indexOf("/#") == -1) {
                    ls[i].onclick = function() {
                        if (this.hostname != document.location.hostname) {
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
        }
        this.currentFrame.loadElements();
    }

    clearContainer() {
        this.container.innerHTML = "";
        if (this.container != document.body) {
            this.loadHeaders();
        }
    }
    loadHeaders() {
        var me = this;
        var containingElement = this.container;
        if (this.container == document.body) {
            containingElement = document.getElementsByTagName("head")[0];
        }
        for (var i = 0; i < this.headers.length; i++) {

            var s = document.getElementsByTagName('script')[0];
            //  document.head.innerHTML += this.headers[i].trim();

            var div = document.createElement('div');
            div.innerHTML = this.headers[i].trim();
            var element = div.firstChild;
            // Change this to div.childNodes to support multiple top-level nodes
            if (element && element.src) {
                var script = document.createElement('script');
                script.onload = function() {
                    this._executed2 = true;
                    if (me.checkHeadersLoaded()) {
                        me.headersLoaded = true;
                        if (me.onHeadersLoaded != null) {
                            me.onHeadersLoaded();
                        }
                    }
                }
                script.src = element.src;
                containingElement.appendChild(script);
            }
            else {
                containingElement.appendChild(element);
            }


        }


    }
    checkHeadersLoaded() {
        var tags = document.getElementsByTagName("script");
        for (var i = 0; i < tags.length; i++) {
            if (!tags[i]._executed2) {
                return false;
            }
        }
        return true;
    }
    fetchURL(url, callback) {
        fetch(url)
            .then(function(response) {
                return response.text();
            })
            .then(function(html) {
                callback(html);
            });
    }

}
