'use strict';
/* global fetch */
import {
    ContentBase
}
from './contentBase.js'
export class Element extends ContentBase {
    constructor(basePath, framename, elmentname) {
        super();
        if(basePath.length>0)
            this.contentFile = "/" + basePath + "/frames/" + framename + "/elements/" + elmentname + "/" + elmentname + ".html";
        else
            this.contentFile = "/frames/" + framename + "/elements/" + elmentname + "/" + elmentname + ".html";
        this.frame = null;
    }

}
