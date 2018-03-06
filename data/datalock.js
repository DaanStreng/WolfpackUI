Element.prototype.data = function(propertyName, value){
     if(this._wpuidata == undefined){
         this._wpuidata = {};
     }
    if(value == undefined){
       return this._wpuidata[propertyName];
    }else{
        this._wpuidata[propertyName] = value;
    }
}
Element.prototype.nextAll = function(filter){
    var siblings = [];
    var el = this;
    while (el= el.nextSibling) { if (!filter || filter(el)) siblings.push(el); }
    return siblings;
}
Element.prototype.html = function(content){
    if(content == undefined){
        return this.innerHTML;
    }else{
        this.innerHTML = content;
    }
}
Element.prototype.attr = function(propertyName,value){
    if(value == undefined){
        return this.getAttribute(propertyName);
    }else{
        this.setAttribute(propertyName,value);
    }
}
Element.prototype.append = function(html){
    if(typeof html == 'string'){
       this.insertAdjacentHTML( 'beforeend',html.trim());
       return this.lastChild;
    }else this.appendChild(html);
    return html;
    
}
NodeList.prototype.forEach = HTMLCollection.prototype.forEach = function(callback){

    for(var i = 0;i<this.length;i++){
        callback(this.item(i));
    }
};


NodeList.prototype.each = HTMLCollection.prototype.each = function(callback){
    this.forEach(callback);
}

Element.prototype.datalockObjectChanged = function(property, oldval, newval) {
    var datalock = this.data("datalock");
    console.log(this);
    this.wpuiFill(datalock);
    return newval;
    var d = 1;
}
Element.prototype.empty = function(){
    this.html("");
}

Element.prototype.wpuiFill = function(baseObject, parent) {
   
    var me = this;
  
    var children = this.children;
   
    //Check what the original contennt, without replacements was.
    //This will allow us to keep update from the original template
    var originalContent = this.data("wpuiOriginalFill");
    var htmlContent = false;
    //Make sure the original content is set properly
    if (!originalContent) {
        originalContent = this.html();
        this.data("wpuiOriginalFill", originalContent);
    }
    if (children.length == 0) {
        //If there are no child objects we should fill the object from the
        //original template
        htmlContent = originalContent;
        
    }
    else {
       
        //Recursively fill out all the children of the template
        children.each(function(element) {
  
            var child = element;
            
            if (child.attr("wpui-for")) {
               
                var forKey = child.attr("wpui-for");
                if (forKey && baseObject[forKey] && baseObject[forKey].constructor === Array) {
                    child.wpuiFor(baseObject[forKey]);
                }
            }
            else if (child.attr("wpui-object")) {
                var forKey = child.attr("wpui-object");
                if (forKey && baseObject[forKey] && typeof baseObject[forKey] == "object") {
                    child.datalock(baseObject[forKey]);
                }
            }
            else if (child.attr("wpui-if")) {
                child.wpuiIf(baseObject, child.attr("wpui-if"));
            }
            else if (!child.attr("wpui-stop") && !child.data("datalock")) {
                if(parent!==undefined)
                    child.wpuiFill(baseObject,parent);
                else
                    child.wpuiFill(baseObject,me);
            }
        });
        htmlContent = this.html();
    }

    //The magical part
    //After filling all the children according to the template we fill the
    //Whole template with the base object. The result being that if any
    //children use the values from the baseobject within their templates
    //by useing baseobject.property these will get filled as expected as well
    if (htmlContent.indexOf("{{") != -1) {

        var splits = htmlContent.split("{{");
        var items = [];
        for (var i = 0; i < splits.length; i++) {
            if (splits[i].indexOf("}}") != -1) {
                var subSplit = splits[i].substr(0, splits[i].indexOf("}}"));
                items.push(subSplit);
            }
        }
        for (var i = 0; i < items.length; i++) {
            var key = items[i];
            var value;
            if (typeof baseObject == "object") {
                if (baseObject[key]) {
                    value = baseObject[key];
                }
                else {
                    //This else block is what makes using nested properties
                    //possible. It requires an extra lock because watch does
                    //not make it possible to watch nested properties
                    //Whenever a nested property changes the base element
                    //Gets rerendered.
                    var getter = "value = baseObject." + key;
                    eval(getter);
                    if (value === undefined) {
                        getter = "value = baseObject" + key;
                        eval(getter);
                    }
                 
                    var pointIndex = key.lastIndexOf(".");
                    var bracketIndex = key.lastIndexOf("[");
                    var locatedObject = "";
                    var locatedProperty = "";
                    var sparent = this;
                    if(parent !==undefined){
                        sparent = parent;
                    }
                    
                    if(pointIndex>bracketIndex){
                        locatedObject = key.substr(0,pointIndex);
                        locatedProperty = key.substr(pointIndex+1);
                        var watchVars = sparent.data("watched");
                        if(!watchVars){
                            watchVars = [];
                        }
                        if (watchVars.indexOf(key)==-1){
                            watchVars.push(key);
                            sparent.data("watched",watchVars);
                            var datalockEval = "baseObject."+locatedObject+".watch(\""+locatedProperty+"\", sparent, sparent.datalockObjectChanged);";
                            eval(datalockEval);
                        }
                    }
                    else if (pointIndex<bracketIndex){
                        locatedObject = key.substr(0,bracketIndex);
                        locatedProperty = key.substr(bracketIndex+1);
                        if(locatedProperty.indexOf("'")>0||locatedProperty.indexOf('"')>0){
                            locatedProperty = locatedProperty.replace("'","").replace('"',"");
                            var datalockEval = "baseObject."+locatedObject+".watch(\""+locatedProperty+"\", sparent, sparent.datalockObjectChanged);";
                            eval(datalockEval);
                        }
                    }
                   
                }
            }
            else if (key === "value") {
                value = baseObject;
            }
            if(value!=='undefined')
                htmlContent = htmlContent.replace("{{" + key + "}}", value);
        }
        this.html(htmlContent);
    }


    //Setting the attributes of the ellement to allwo templating
    for (var i = 0, atts = this.attributes, n = atts.length, arr = []; i < n; i++) {
        arr.push(atts[i].nodeName);

        var atr = this.attr(atts[i].nodeName);

        if (atr.indexOf("{{") != -1) {
            var splits = atr.split("{{");
            var items = [];
            for (var i = 0; i < splits.length; i++) {
                if (splits[i].indexOf("}}") != -1) {
                    var subSplit = splits[i].substr(0, splits[i].indexOf("}}"));
                    items.push(subSplit);
                }
            }
            for (var i = 0; i < items.length; i++) {
                var key = items[i];
                var value;
                if (typeof baseObject == "object") {
                    if (baseObject[key]) {
                        value = baseObject[key];
                    }
                }
                else if (key === "value") {
                    value = baseObject;
                }
                atr = atr.replace("{{" + key + "}}", value);
            }
            this.attr(atts[i].nodeName, atr);
        }

    }

}
Element.prototype.wpuiIf = function(dataObject, key) {
    var value = checkValidity(key, dataObject);;
    var isfalseString = (value === 'false');

    var ifContent = this.data("wpuiIfContent");
    if (!ifContent) {
        ifContent = this.html();
        this.data("wpuiIfContent", ifContent);
    }

    if (!value || isfalseString) {
        this.empty();
        var siblings = this.nextAll();
        var foundTrue = false;
        siblings.each(function() {
            if (this.attr("wpui-if")) {
                //will get filled another way
                foundTrue = true;
                return;
            }
            if (this.attr("wpui-elseif")) {
                var key2 = this.attr("wpui-elseif");
                var value2 = checkValidity(key2, dataObject);
                var isfalseString = (value2 === 'false');

                var ifElseContent = this.data("wpuiIfContent");
                if (!ifElseContent) {
                    ifElseContent = this.html();
                    this.data("wpuiIfContent", ifElseContent);
                }
                if (foundTrue) {
                    this.empty();
                    return;
                }




                if (value2 && !isfalseString) {
                    foundTrue = true;
                    this.html(ifElseContent);
                    this.wpuiFill(dataObject);
                }
                else {
                    this.empty();
                }
            }
            if (typeof this.attr("wpui-else") !== 'undefined') {
                var elseContent = this.data("wpuiIfContent");
                if (!elseContent) {
                    elseContent = this.html();
                    this.data("wpuiIfContent", elseContent);
                }
                if (!foundTrue) {
                    foundTrue = true;
                    this.html(elseContent);
                    this.wpuiFill(dataObject);
                }
                else {
                    this.empty();
                }
            }
        });
    }
    else {
        var siblings = this.nextAll();
        this.html(ifContent);
        siblings.each(function() {

            if (this.attr("wpui-elseif") || typeof this.attr("wpui-else") !== 'undefined') {
                var previousContent = this.data("wpuiIfContent");
                if (!previousContent) {
                    previousContent = this.html();
                    this.data("wpuiIfContent", previousContent);
                }
                this.empty();
            }
        });
        this.wpuiFill(dataObject);
    }
}

function checkValidity(key, object) {

    var tt = false;
    key = "tt = object." + key + ";";
    eval(key);
    return tt;

}

Element.prototype.wpuiFor = function(dataArray) {
    var me = this;
    var originalContent = me.data("wpuiForContent");
    if (!originalContent) {
        originalContent = me.html();
        me.data("wpuiForContent", originalContent);
    }
    me.empty();
    for (var i = 0; i < dataArray.length; i++) {
        var element = originalContent;
        element = me.append(element);
        element.datalock(dataArray[i]);
    }
}
Element.prototype.datalock = function(dataobject){
    this.data("datalock", dataobject);
    var originalContent = this.data("wpuiOriginalContent");
    if (!originalContent) {
        originalContent = this.html();
        this.data("wpuiOriginalContent", originalContent);
    }
    else {
        this.empty();
        this.html(originalContent);
    }
    for (var propertyName in dataobject) {
        dataobject.watch(propertyName, this, this.datalockObjectChanged);
    }
    this.wpuiFill(dataobject);


        if (this.attr("wpui-for")) {
            var forKey = this.attr("wpui-for");
            if (forKey && dataobject && dataobject.constructor === Array) {
                this.wpuiFor(dataobject);
            }
        }
        else if (this.attr("wpui-object")) {
            var forKey = this.attr("wpui-object");
            if (forKey && dataobject && typeof dataobject == "object") {
                this.datalock(dataobject);
            }
        }
        else if (this.attr("wpui-if")) {

            this.wpuiIf(dataobject, this.attr("wpui-if"));
        }
        else if (!this.attr("wpui-stop") && !this.data("datalock")) {
            this.wpuiFill(dataobject);
        }
        else this.wpuiFill(dataobject);
    
}
if(window.jQuery !== undefined){
    jQuery.fn.datalock = function(dataobject) {
        for(var i =0;i<this.length;i++){
            this[i].datalock(dataobject);
        }
    }
}
