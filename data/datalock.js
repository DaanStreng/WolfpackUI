Element.prototype.datalockObjectChanged = function(property, oldval, newval) {
    var datalock = $(this).data("datalock");
    this.wpuiFill(datalock);
    return newval;
}
Element.prototype.wpuiFill = function(baseObject) {
    var me = $(this);
    var children = me.children();
    if (children.length == 0) {
        var originalContent = $(this).data("wpuiOriginalFill");
        if (!originalContent) {
            originalContent = $(this).html();
            $(this).data("wpuiOriginalFill", originalContent);
        }
        var htmlContent = originalContent;
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
                }
                else if (key === "value") {
                    value = baseObject;
                }
                htmlContent = htmlContent.replace("{{" + key + "}}", value);
            }
            $(this).html(htmlContent);
        }
    }
    else {
        children.each(function() {
            var child = $(this);

            if (child.attr("wpui-for")) {
                var forKey = child.attr("wpui-for");
                if (forKey && baseObject[forKey] && baseObject[forKey].constructor === Array) {
                    this.wpuiFor(baseObject[forKey]);
                }
            }
            else if (child.attr("wpui-object")) {
                var forKey = child.attr("wpui-object");
                if (forKey && baseObject[forKey] && typeof baseObject[forKey] == "object") {
                    child.datalock(baseObject[forKey]);
                }
            }
            else if (child.attr("wpui-if")) {
                this.wpuiIf(baseObject, child.attr("wpui-if"));
            }
            else if (!$(this).attr("wpui-stop") && !$(this).data("datalock")) {
                this.wpuiFill(baseObject);
            }
        });
    }

    for (var i = 0, atts = this.attributes, n = atts.length, arr = []; i < n; i++) {
        arr.push(atts[i].nodeName);

        var atr = $(this).attr(atts[i].nodeName);

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
            $(this).attr(atts[i].nodeName, atr);
        }

    }

}
Element.prototype.wpuiIf = function(dataObject, key) {
    var value = checkValidity(key, dataObject);;
    var isfalseString = (value === 'false');

    var ifContent = $(this).data("wpuiIfContent");
    if (!ifContent) {
        ifContent = $(this).html();
        $(this).data("wpuiIfContent", ifContent);
    }

    if (!value || isfalseString) {
        $(this).empty();
        var siblings = $(this).nextAll();
        var foundTrue = false;
        siblings.each(function() {
            if ($(this).attr("wpui-if")) {
                //will get filled another way
                foundTrue = true;
                return;
            }
            if ($(this).attr("wpui-elseif")) {
                var key2 = $(this).attr("wpui-elseif");
                var value2 = checkValidity(key2, dataObject);
                var isfalseString = (value2 === 'false');

                var ifElseContent = $(this).data("wpuiIfContent");
                if (!ifElseContent) {
                    ifElseContent = $(this).html();
                    $(this).data("wpuiIfContent", ifElseContent);
                }
                if (foundTrue) {
                    $(this).empty();
                    return;
                }




                if (value2 && !isfalseString) {
                    foundTrue = true;
                    $(this).html(ifElseContent);
                    this.wpuiFill(dataObject);
                }
                else {
                    $(this).empty();
                }
            }
            if (typeof $(this).attr("wpui-else") !== 'undefined') {
                var elseContent = $(this).data("wpuiIfContent");
                if (!elseContent) {
                    elseContent = $(this).html();
                    $(this).data("wpuiIfContent", elseContent);
                }
                if (!foundTrue) {
                    foundTrue = true;
                    $(this).html(elseContent);
                    this.wpuiFill(dataObject);
                }
                else {
                    $(this).empty();
                }
            }
        });
    }
    else {
        var siblings = $(this).nextAll();
        $(this).html(ifContent);
        siblings.each(function() {

            if ($(this).attr("wpui-elseif") || typeof $(this).attr("wpui-else") !== 'undefined') {
                var previousContent = $(this).data("wpuiIfContent");
                if (!previousContent) {
                    previousContent = $(this).html();
                    $(this).data("wpuiIfContent", previousContent);
                }
                $(this).empty();
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
    var me = $(this);
    var originalContent = me.data("wpuiForContent");
    if (!originalContent) {
        originalContent = me.html();
        me.data("wpuiForContent", originalContent);
    }
    me.empty();
    for (var i = 0; i < dataArray.length; i++) {
        var element = $(originalContent);
        me.append(element);
        element.datalock(dataArray[i]);
    }
}
jQuery.fn.datalock = function(dataobject) {
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
        for (var i = 0; i < this.length; i++) {
            dataobject.watch(propertyName, this[i], this[i].datalockObjectChanged);
        }
    }
    for (var i = 0; i < this.length; i++) {
        this[i].wpuiFill(dataobject);
    }

    for (var i = 0; i < this.length; i++) {

        var child = $(this[i]);

        if (child.attr("wpui-for")) {
            var forKey = child.attr("wpui-for");
            if (forKey && dataobject && dataobject.constructor === Array) {
                this[i].wpuiFor(dataobject);
            }
        }
        else if (child.attr("wpui-object")) {
            var forKey = child.attr("wpui-object");
            if (forKey && dataobject && typeof dataobject == "object") {
                child.datalock(dataobject);
            }
        }
        else if (child.attr("wpui-if")) {

            this[i].wpuiIf(dataobject, child.attr("wpui-if"));
        }
        else if (!$(this[i]).attr("wpui-stop") && !$(this[i]).data("datalock")) {
            this[i].wpuiFill(dataobject);
        }
        else this[i].wpuiFill(dataobject);

    }

}
