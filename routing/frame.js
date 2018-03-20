'use strict';
/* global fetch */
import {
    ContentBase
}
from './contentBase.js'
export class Frame extends ContentBase {
    constructor(basePath, framename, pageContentID) {
        super();
        this.contentFile = "/" + basePath + "/frames/" + framename + "/" + framename + ".html";
        this.frameBase = "/" + basePath + "/frames/" + framename;
        this.basePath = basePath;
        this.name = framename;
        this.pages = [];
        this.pageContentID = pageContentID;
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
            else{console.log("fuu"); reject()};
        });

    }
    setPage(pagename) {
        var me = this;
        this.getPage(pagename).then(page => {
            page.addOnPartLoadedHandlers(me,me.pageLoaded);
            document.getElementById(me.pageContentID).ContentBase = page;
            page.frame = me;
            page.getContent().then(html => {
                document.getElementById(me.pageContentID).innerHTML = html;
                page.onLoaded();
            });
        }).catch(function(){
            document.getElementById(me.pageContentID).innerHTML = "404";
        })
    }
    pageLoaded(){
        this.onPartLoaded();
    }
}
