'use strict';
/* global fetch */
import {
    Frame
}
from './frame.js';
export class Router {
    constructor() {
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
                
                "<script src=\"https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-alpha.4/js/materialize.min.js\"></script>",
                '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-alpha.4/css/materialize.min.css">',
                '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>'
            ]
        }
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
                me.container.innerHTML = me.container.innerHTML + html;
                frame.setPage(actualPage);
                 
            });


        });

    }
    framePartLoaded() {
        if (this.catchNavigation) {
            var me = this;
            for (var ls = document.links, numLinks = ls.length, i = 0; i < numLinks; i++) {
                var href = ls[i].href;
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

    clearContainer() {
        this.container.innerHTML = "";
        if (this.container != document.body) {
            this.loadHeaders();
        }
    }
    loadHeaders() {
        
        if (this.container == document.body) {
            for (var i = 0; i < this.headers.length; i++) {
                
                var s=document.getElementsByTagName('script')[0];
              //  document.head.innerHTML += this.headers[i].trim();
                
                 var div = document.createElement('div');
                  div.innerHTML = this.headers[i].trim();
                  var element = div.firstChild;
                  console.log(element.tagName);
                  if(element.tagName.toLowerCase() == "script"){
                      if(element.src.indexOf("http")==-1){
                      import(this.basePath+element.src);
                      }
                      else import(element.src);
                  }
                
                  // Change this to div.childNodes to support multiple top-level nodes
                  s.parentNode.insertBefore(div.firstChild,s);
                  
            }
        }
        else {
            this.container.appendChild(this.headers[i]);
        }
     
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
