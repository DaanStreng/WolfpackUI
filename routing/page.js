'use strict';
/* global fetch */
import {
    ContentBase
}
from './contentBase.js'
export class Page extends ContentBase {
    constructor(basePath, framename, pagename) {
        super();
        if(basePath.length>0)
            this.contentFile = "/" + basePath + "/frames/" + framename + "/pages/" + pagename + "/" + pagename + ".html";
        else
            this.contentFile = "/frames/" + framename + "/pages/" + pagename + "/" + pagename + ".html";
        this.frame = null;
    }

    onLoaded() {
        super.onLoaded();
    }

}
