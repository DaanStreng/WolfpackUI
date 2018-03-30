'use strict';
/* global fetch */
import {
    ContentBase
}
from './contentBase.js'
export class Element extends ContentBase {
    constructor(basePath, framename, elmentname) {
        super();
        this.contentFile = "/" + basePath + "/frames/" + framename + "/elements/" + elmentname + "/" + elmentname + ".html";
        this.frame = null;
    }

}
