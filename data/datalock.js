/* 
 * Wolfpack's Datalock library
 *
 * Since 01-03-2018
 *
 * By Daan Streng, for Wolfpack IT (https://wolfpackit.nl)
 *
 * "Depends" on the deprecated object.watch function
 * This function was only ever implemented by firefox up to version 58
 * To compensate for this function not existing we use a tiny polyfill
 *
 * ©Wolfpack IT - All rights reserved
 * Feel free to use in personal projects without contacting us.
 * Please contact us if you intend to use it for commercial products
 * Not to get any money from you or anything, but we might want to use your
 * project to showcase as a project that uses Wolfpack software
 *
 * [TODO] REALLY REALLY needs some refactoring
 *
 */

// Should get called whenever the object the element is locked to is changed
// You could have another function called when using watch but in that case
// Your html won't change so this is the prefered one
Element.prototype.datalockObjectChanged = function(property, oldval, newval) {
    var checkOne = window.performance.now();
    var datalock = this.data("datalock");
    this.wpuiFill(datalock);
    return newval;
}

// Replaces all placeholders with their corresponding 
Element.prototype.wpuiFill = function(baseObject, parent) {
    var me = this;
    var children = this.children;
    //Check what the original content, without replacements was.
    //This will allow us to keep update from the original template
    var originalContent = this.data("wpuiOriginalFill");
    var htmlContent = false;
    var fillThrough = true;
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
        //Depending on the wpui attributes
        children.each(function(child) {
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
                // If you specify wpui to stop going from this element on
                // Or the element is datalocked to some other element
                // We should not keep checking it.
                if (parent !== undefined)
                    child.wpuiFill(baseObject, parent);
                else
                    child.wpuiFill(baseObject, me);
            }
            else{
                fillThrough = false;
            }
        });
        htmlContent = this.html();
    }

    //The magical part
    //After filling all the children according to the template we fill the
    //Whole template with the base object. The result being that if any
    //children use the values from the baseobject within their templates
    //by useing baseobject.property these will get filled as expected as well
    if (htmlContent.indexOf("{{") != -1 && fillThrough) {
        var newValue = this.replaceVariablesInString(htmlContent,baseObject,parent);
        this.html(newValue);
    }
    //Setting the attributes of the element to allow templating in attributes
    for (var i = 0, atts = this.attributes, n = atts.length; i < n; i++) {
        var atr = this.attr(atts[i].nodeName);
        if (atr.indexOf("{{") != -1) {
            var newValue = this.replaceVariablesInString(atr,baseObject,parent);
            this.attr(atts[i].nodeName, newValue);
        }
    }
}

Element.prototype.lockNestedProperty = function(baseObject, key, parentElement) {
    //This is what makes using nested properties
    //possible. It requires an extra lock because watch does
    //not make it possible to watch nested properties
    //Whenever a nested property changes the base element
    //Gets rerendered.
    var value;
    var getter = "value = baseObject." + key;
    var addPoint = "."; //Variable used to later make sure you can use
    //both object.variable and object['variable']
    try {
        eval(getter); //Love how this actually works
    }
    catch (exception) {}
    //If the eval worked out value is now set.
    if (value === undefined) {
        //This is for if you wish to use things like object['variable']
        //Or even object[1].variable
        getter = "value = baseObject" + key;
        try {
            eval(getter);
            addPoint = "";
        }
        catch (exception) {
            //Returns undefined, you done messed up
            return value;
        }
    }
    var pointIndex = key.lastIndexOf(".");
    var bracketIndex = key.lastIndexOf("[");
    var locatedObject = "";
    var locatedProperty = "";
    var sparent = this;
    if (parentElement !== undefined) {
        sparent = parentElement;
    }

    if (pointIndex > bracketIndex) {
        locatedObject = key.substr(0, pointIndex);
        locatedProperty = key.substr(pointIndex + 1);
        var watchVars = sparent.data("watched");
        if (!watchVars) {
            watchVars = [];
        }
        if (watchVars.indexOf(key) == -1) {
            watchVars.push(key);
            sparent.data("watched", watchVars);
            var datalockEval = "baseObject" + addPoint + locatedObject + ".watch(\"" + locatedProperty + "\", sparent, sparent.datalockObjectChanged);";
            eval(datalockEval);
        }
    }
    else if (pointIndex < bracketIndex) {
        locatedObject = key.substr(0, bracketIndex);
        locatedProperty = key.substr(bracketIndex + 1);
        if (locatedProperty.indexOf("'") > 0 || locatedProperty.indexOf('"') > 0) {
            locatedProperty = locatedProperty.replace("'", "").replace('"', "");
            var datalockEval = "baseObject" + addPoint + locatedObject + ".watch(\"" + locatedProperty + "\", sparent, sparent.datalockObjectChanged);";
            eval(datalockEval);
        }
    }
    return value;
}


Element.prototype.wpuiIf = function(dataObject, key) {
    var value = wpui_checkValidity(key, dataObject);;
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
                var value2 = wpui_checkValidity(key2, dataObject);
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
        console.log(element,element.constructor);
        if(element.constructor != Text)
            element.datalock(dataArray[i]);
        else element.data = (this.replaceVariablesInString(element.data,dataArray[i],undefined));
    }
}
Element.prototype.datalock = function(dataobject) {
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
    else if (this.attr("wpui-if")) {

        this.wpuiIf(dataobject, this.attr("wpui-if"));
    }
    else if (!this.attr("wpui-stop") && !this.data("datalock")) {
        this.wpuiFill(dataobject);
    }
    else this.wpuiFill(dataobject);
}
NodeList.prototype.datalock = function(dataobject){
    this.forEach(function(me){
       me.datalock(dataobject); 
    });
}

function wpui_checkValidity(key, object) {

    var tt = false;
    key = "tt = object." + key + ";";
    eval(key);
    return tt;

}

Element.prototype.replaceVariablesInString = function(originalString, object, parent) {
    var replacementString = originalString;
    var splits = replacementString.split("{{");
    var items = [];
    for (var j = 0; j < splits.length; j++) {
        if (splits[j].indexOf("}}") != -1) {
            var subSplit = splits[j].substr(0, splits[j].indexOf("}}"));
            items.push(subSplit);
        }
    }
    for (var j = 0; j < items.length; j++) {
        var key = items[j];
        var value;
        if (typeof object == "object") {
            if (object[key]) {
                value = object[key];
            }
            else {
                console.log("as expected");
                value = this.lockNestedProperty(object, key, parent);
            }
        }
        else if (key === "value") {
            value = object;
        }
        replacementString = replacementString.replace("{{" + key + "}}", value);
    }
    return replacementString;
}

if (window.jQuery !== undefined) {
    jQuery.fn.datalock = function(dataobject) {
        for (var i = 0; i < this.length; i++) {
            this[i].datalock(dataobject);
        }
    }
}
