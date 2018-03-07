//Object.watch polyfill
//Variables have been minified
//Basically just adds getters and setters to every property you start watching

Object.prototype.watch || Object.defineProperty(Object.prototype, "watch", {
    enumerable: !1,
    writable: !1,
    configurable: !0,
    value: function(t, e, r) {
        this[t] && this[t].constructor === Array && (this[t].oldPush || (this[t].oldPush = this[t].push), this[t].push = function(i) {
            var n = this.oldPush(i);
            return r.call(e, t, this, this), n
        });
        var i = this[t],
            n = i;
        delete this[t] && Object.defineProperty(this, t, {
            get: function() {
                return n
            },
            set: function(h) {
                return i = n, n = h, n = r.call(e, t, i, h)
            },
            enumerable: !0,
            configurable: !0
        })
    }
}), Object.prototype.unwatch || Object.defineProperty(Object.prototype, "unwatch", {
    enumerable: !1,
    writable: !1,
    configurable: !0,
    value: function(t) {
        var e = this[t];
        delete this[t], this[t] = e
    }
});