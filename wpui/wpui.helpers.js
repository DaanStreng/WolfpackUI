// Replacement for jQuery's data function
// This is fairly important to be able to Datalock.
// We need to store the original template content within an element to be 
// able to rerender it whenever an object changes.
// e.g. we need to remember the content used to be <h1>{{property}}</h1>
// because after datafilling it once the new content is <h1>foo</h1>
Element.prototype.data = function(propertyName, value) {
    if (this._wpuidata == undefined) {
        this._wpuidata = {};
    }
    if (value == undefined) {
        return this._wpuidata[propertyName];
    }
    else {
        this._wpuidata[propertyName] = value;
    }
}


// Replacement for jQuery's nextAll function
Element.prototype.nextAll = function(filter) {
    var siblings = [];
    var el = this;
    while (el = el.nextSibling) {
        if (!filter || filter(el)) siblings.push(el);
    }
    return siblings;
}

// Replacement for jQuery's HTML function
Element.prototype.html = function(content) {
    if (content == undefined) {
        return this.innerHTML;
    }
    else {
        this.innerHTML = content;
    }
}

// Rplacement for jQuery's attr function
Element.prototype.attr = function(propertyName, value) {
    if (value == undefined) {
        return this.getAttribute(propertyName);
    }
    else {
        this.setAttribute(propertyName, value);
    }
}

// Replacement for jQuery's append function
Element.prototype.append = function(html) {
    if (typeof html == 'string') {
        this.insertAdjacentHTML('beforeend', html.trim());
        return this.lastChild;
    }
    else this.appendChild(html);
    return html;

}

// Replacement for jQuery's empty function
Element.prototype.empty = function() {
    this.html("");
}

// Replacement for jQuery's forEach function
// Does not function exactly as jquery's forEach.
// in the callback, this, does not correspond to the selected element 
// instead, the value passed to the callback is the element
NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.each = function(callback) {
    for (var i = 0; i < this.length; i++) {
        callback(this.item(i));
    }
};

Array.prototype.item = function(index){
    return this[index];
}

// Synonym for forEach
NodeList.prototype.each = HTMLCollection.prototype.each = Array.prototype.each = function(callback) {
    this.forEach(callback);
}



var WPUIBase = function() {
    this.always = function(selector, event, callback) {
        $("body").on(event, selector, callback);
    };
};
var WPUI = new WPUIBase();
