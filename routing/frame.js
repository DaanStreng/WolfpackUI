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
        if(basePath.length>0)
            this.contentFile = "/" + basePath + "/frames/" + framename + "/" + framename + ".html";
        else this.contentFile = "/frames/" + framename + "/" + framename + ".html";
        if(basePath.length>0)
            this.frameBase = "/" + basePath + "/frames/" + framename;
        else this.frameBase = "/frames/" + framename;
        this.basePath = basePath;
        this.name = framename;
        this.pages = [];
        this.pageContentID = pageContentID;
        this.elements = [];
        this.donetwice = 0;
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
        this.getPage(pagename).then(page => {
            page.addOnPartLoadedHandlers(me, me.pageLoaded);
            document.getElementById(me.pageContentID).ContentBase = page;
            page.frame = me;
            page.getContent().then(html => {
                document.getElementById(me.pageContentID).innerHTML = html;
                page.onLoaded();
            });
        }).catch(function() {
            document.getElementById(me.pageContentID).innerHTML = "404";
        })
    }
    pageLoaded() {
        this.onPartLoaded();
    }
    loadElements() {
        var elementNodes = document.querySelectorAll("[wpui-element]");
        for (var i = 0; i < elementNodes.length; i++) {
            var currentNode = elementNodes[i];
            if (!currentNode.element) {
                var element = new Element(this.basePath, this.name, currentNode.getAttribute("wpui-element"));
                element.addOnPartLoadedHandlers(this, this.onPartLoaded);
                currentNode.element = element;
                element.getContent().then(html => {
                    currentNode.innerHTML = html;
                    element.onLoaded();

                }).catch(error => {
                    console.error(error);
                })
            }
        }
    }
}
