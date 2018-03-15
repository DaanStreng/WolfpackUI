'use strict';
/* global fetch */
import {ContentBase} from './contentBase.js'
export class Page extends ContentBase {
    constructor(basePath, framename, pagename) {
        super();
        this.contentFile = "/"+basePath + "/frames/" + framename + "/pages/"+pagename+"/"+pagename + ".html";
        this.frame = null;
    }
    
}
