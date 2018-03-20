'use strict';
import {Frame} from '/WolfpackUI/routing/frame.js'
export default class MuscleFit extends Frame{
    
    constructor(basePath){
        super(basePath,"musclefit","content");
        this.pages = ["home","boxing"];
    }
}