'use strict';
import {Page} from '/WolfpackUI/routing/page.js'
export default class Home extends Page{
    constructor(basePath, framename, pagename){
        super(basePath, framename, pagename);
    }
    onLoaded(){
        super.onLoaded();
        this.frame.onBeforeUnload = function(){return new Promise(function(resolve,reject){
          setTimeout(function(){resolve()},1000);
        });};
    }
}