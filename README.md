# WolfpackUI
A tiny template thingy
Requires JQuery 3.x
## What's it for?
WolfpackUI is a very small HTML/javascript templating engine. It allows you to hook the contents of your HTML-elements
to objects. When the object changes, the HTML changes.

## How to use
### Basics
To hook an object to an element:
```javascript
//To connect an object to an element just do this
var object = {foo:"hello",bar:"world"};
$("#selector").datalock(object);
```
To make sure the element shows the element
```html
<div id="selector">
  <h1>{{foo}}</h1>
  <h2>{{bar}}</h2>
</div>
```
This should result in something like:
<div>
  <div style="border:none;font-size:50px">hello</div>
  <div style="border:none;font-size:30px">World</div>
</div>

### More complex
Some extra html attributes are possible for more fancy shizzle

```javascript
var object = {foo:"hello",
              bar:"world",
              words:["word1","word2","word3"],
              objects:[{name:"object1"},{name:"object2"}],
              childobject:{greeting:"Hello world!"},
              showBar:false
              };
$("#selector").datalock(object);
```

```html
<!-- example showing if else block -->
<div id="selector">
  <div wpui-if="showBar">
    <!-- Everything in here only renders if object.showBar == true -->
  </div>
  <div wpui-elseif="bar=='world'">
    <!-- Everything in here only renders if object.bar == "world" -->
  <div>
  <div wpui-else>
    <!-- Everything in here only renders if previous two werent true -->
  </div>
</div>
<!--
If-block extends throughout the concecutive sibblings and stops
when either the parent element is closed or a new if-block is started.
-->
```

```html
<!-- example showing the use of arrays and child-objects -->
<div id="selector">
  <div wpui-for="words">
      <!-- the next p gets rendered once for every element in object.words
      {{value}} gets replaced with the value of the element -->
      <p>{{value}}</p>
  </div>
  <div wpui-for="objects">
      <!-- the next div gets rendered once for every element in object.objects
      {{name}} gets replaced with object.objects[index].name.
      Any children of this div are treated as if datalock(object.objects[index])
      has been called upon that div
      -->
      <div>{{name}}</div>
  </div>
  <div wpui-object="childobject">
    <!-- for all children of this div, object.childobject is used
    to set the templated values -->
    <div>
      <p>{{greeting}}</p>
    </div>
  </div>
</div>
```

### nested objects and properties
It is completely fine to use the nested values of objects like

```javascript
var object = {foo:{bar:{name:"foobar"}}}
$("#selector").datalock(object);
```

```html
<div id="selector">
  <h1>
    {{foo.bar.name}}
  </h1>
</div>
```
This will yeild the expeced result.
Note that the engine will try to fill out every templated variable.
This means that when a variable name cannot be filled out with the values from a child object, it will try to do so with values from it's parent.
If this is not the behaviour you expect try matching your expectations with what is happening, that's way easier than changing what's happening.

### Stop using the datalock.
Of course we can imagine a situation in which we don't want the datalock to keep going through all the child elements.<br/>
For this reason we have wpui-stop
```javascript
var object = {foo:"bar"};
$("#selector").datalock(object);
```

```html
<div id="selector">
  <h4>
    {{foo}}
  </h4>
  <h4 wpui-stop="true">
    <!-- or wpui-stop=1 or just wpui-stop -->
    {{foo}}
  </h4>
</div>
```
This will result in <br/>
<div id="selector">
  <h4>
    bar
  </h4>
  <h4 wpui-stop="true">
    <!-- or wpui-stop=1 or just wpui-stop -->
    {{foo}}
  </h4>
</div>

## Important when using UI-events
Whenver any value of an object changes this wil cause a re-render of part of your UI.
So if you link a click handler to an element using jquery like 
```javascript
$(document).ready(function(){
  $("selector").click(function(){}); 
});
```
This link might be gone after a change to the object.
To fix this simply use WPUI.always like this
```javascript
$(document).ready(function(){
  WPUI.always("selector","click",function(){
    alert("clicked");
  });
});
```
This will always link the click event to the selected elements no matter how many times the UI has been rerendered.


