var WPUIBase = function(){
    this.always = function(selector,event, callback){
        $( "body").on(event, selector, callback );
    };
};
var WPUI = new WPUIBase();
