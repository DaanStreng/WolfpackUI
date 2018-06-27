'use strict';
/* global fetch */
import {
    ContentBase
}
from './contentBase.js'
import {
    Element
}
from './element.js'

export class Frame extends ContentBase {
    constructor(basePath, framename, pageContentID) {
        super();
        if (basePath.length > 0)
            this.contentFile = "/" + basePath + "/frames/" + framename + "/" + framename + ".html";
        else this.contentFile = "/frames/" + framename + "/" + framename + ".html";
        if (basePath.length > 0)
            this.frameBase = "/" + basePath + "/frames/" + framename;
        else this.frameBase = "/frames/" + framename;
        this.basePath = basePath;
        this.name = framename;
        this.pages = [];
        this.pageContentID = pageContentID;
        this.elements = [];
        this.donetwice = 0;
        this.totalParts = 0;
        this.loadedParts = 0;
        this.onBeforeUnload = function() { return true; };
    }
    get Pages() {
        return this.pages;
    }



    getPage(pagename) {
        var me = this;

        return new Promise(function(resolve, reject) {
            if (me.pages.includes(pagename)) {

                var pagestring = pagename;
                import (me.frameBase + "/pages/" + pagestring + "/" + pagestring + ".js").then(({
                    default: pagebase
                }) => {
                    var page = new pagebase(me.basePath, me.name, pagestring);
                    resolve(page);
                });
            }
            else {
                reject()
            };
        });

    }
    setPage(pagename) {
        var me = this;
        return new Promise(function(resolve, reject) {

            var result = me.onBeforeUnload();
            if (typeof(result) === 'boolean') {
                if (result) {
                    me.loadedParts = 0;
                    me.totalParts = 0;
                    me.actualLoad(pagename).then(function(){
                        resolve();
                    });
                    
                }
                else {
                    reject();
                }
            }
            else {
                result.then(function() {
                    me.loadedParts = 0;
                    me.totalParts = 0;
                    me.actualLoad(pagename).then(function(){
                        resolve();
                    });
                    
                }).catch(function(error) { reject(); })
            }
        })
    }
    onLoaded() {
        super.onLoaded();
        let me = this;
    }
    onPartLoaded(){
        this.loadedParts++;
        super.onPartLoaded();
    }
    actualLoad(pagename) {
        var me = this;
        return new Promise(function(resolve, reject) {
            me.getPage(pagename).then(page => {
                page.addOnPartLoadedHandlers(me, me.pageLoaded);
                me.totalParts++;
                document.getElementById(me.pageContentID).ContentBase = page;
                page.frame = me;
                page.getContent().then(html => {
                    document.getElementById(me.pageContentID).innerHTML = html;
                    page.onLoaded();
                    resolve();
                });
            }).catch(function(error) {
                document.getElementById(me.pageContentID).innerHTML = "404";
                resolve();
            });
          
        })


    }
    pageLoaded() {
        this.onPartLoaded();
    }
    loadElements() {
        const me = this;
  
        return new Promise(function(resolve, reject) {
            let elementNodes = document.querySelectorAll("[wpui-element]");
            let nodesWithElements = 0;
            const runEnd = resolve;
            for (let i = 0; i < elementNodes.length; i++) {
                const currentNode = elementNodes[i];
                if (!currentNode.element) {
                    const elementname = currentNode.getAttribute("wpui-element");
                    currentNode.element = true;
                    var source = "/" + me.basePath + "/frames/" + me.name + "/elements/" + elementname + "/" + elementname + ".js";
                    source = source.replace("//", "/");
                    const kk = i;
                    me.totalParts++;
                    import (document.location.origin + source)
                    .then(({ default: frameBase }) => {
                        let element = new frameBase(me.basePath, me.name, currentNode.getAttribute("wpui-element"));
                        element.addOnPartLoadedHandlers(me, me.onPartLoaded);
                        currentNode.element = element;
                        element.getContent().then(html => {
                            currentNode.innerHTML = html;
                            element.domNode = currentNode
                            element.domNode.element = element;
                            element.onLoaded();
                            nodesWithElements++;
                            
                            if (nodesWithElements == elementNodes.length - 1) {
                                if (document.querySelectorAll("[wpui-element]").length == elementNodes.length) {
                                    runEnd();
                                }
                                else {
                                    me.loadElements().then(function() {
                                        runEnd();
                                    })
                                }
                            }
                        }).catch(error => {
                            console.error(error);
                        });
                    });
                }else{
                    nodesWithElements++;
                    if(nodesWithElements==elementNodes.length){
                        runEnd();
                    }
                }
            }
        });
    }
}
