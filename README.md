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

