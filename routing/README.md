# WolfpackUI Routing


## What's it for?
This routing thingy is to make sure you can have good-looking navigation.
## Structure
Check /test for the structure of your program <br/>
.htaccess is very important.<br>
## Importing elements
You can import elements by giving your dom-elements a wpui-element attribute specifying the name of the element
```html
<div wpui-element="clock"></div>
```
## Localization
You can add localization to your frames, pages and elements by adding a localization.json file to their containing folder.<br/>
The file should look like this:
```json
{
    "nl":{
        "program":"Programma",
        "register":"Inschrijven"
    },
    "en":{
        "program":"Program",
        "register":"Enlist"
    }
    "default":{
        "program":"Program",
        "register":"Register"
    }
    
}
```
<br/>
and then you can use the localization in your html like this
```html
<div>@{program}</div>
```
<br/>
You can change te language by using the static function Router.setLanguage(language).<br/>
You can set the language to any string. WPUI will just use this string to match the group name in the json fill ('en' and 'nl' in the example)<br/>
So if you wish to add elvish or pirate english as a language feel free to do so.<br/>
If no translation can be found for a particular language, WPUI looks up the translation in the 'default' group.<br/>
So it is highly recommended to put all your needed translations into default with english values. This works especially well when adding Pirate English. 
