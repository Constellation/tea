/*
 * Tea.js
 *
 * have a good tea time.
 *
 */

if (typeof(Tea) == 'undefined') Tea = function(){};
Tea.NAME = 'Tea';
Tea.VERSION = '0.0.1alpha';

/* Tea.Class */
Tea.Class = function(o, p){
  if(o.init) var c = o.init;
  else var c = function(){};
  c.prototype = p || {};
  c.prototype.constructor = c;
  for(var i in o){
    if(typeof(c[i]) != 'undefined' || i == 'init') continue;
    c[i] = o[i]
  }
  return c;
}

Tea.Function = {
  addBefore: function(o, m, f){
    if(!o[m]) return false;
    var original = o[m];
    o[m] = function(){
      f.apply(o, arguments);
      return original.apply(o, arguments);
    }
  },
}

Tea.Array = {
  indexOf: function(a, e){
    for(var i=0,l=a.length;i<l;i++)
      if(a[i] == e) return i;
    return -1;
  },

  isArray: function(a){
    return (a instanceof Array || (a && typeof(a.length) == 'number' && typeof(a) != 'string'))
  },

  flatten: function(a){
    var ret = [];
    var f = function(arr){
      Tea.Array.forEach(arr, function(e){
        if(Tea.Array.isArray(e))
          f(e);
        else
          ret.push(e);
      });
    }
    f(a);
    return ret;
  },

  forEach: function(a, f){
    var r = 0;
    var l = a.length;
    var i = l%8;
    if(i>0) do {
      f(a[r],r++,a)
    } while (--i);
    i = parseInt(l >> 3)
    if(i>0) do {
      f(a[r],r++,a);f(a[r],r++,a);
      f(a[r],r++,a);f(a[r],r++,a);
      f(a[r],r++,a);f(a[r],r++,a);
      f(a[r],r++,a);f(a[r],r++,a);
    } while (--i);
  },

  map: function(a, f){
    var ret = [];
    Tea.Array.forEach(a, function(e, r, arr){
      ret.push(f(e, r, arr));
    });
    return ret;
  },

  filter: function(a, f){
    var ret = [];
    Tea.Array.forEach(a, function(e, r, arr){
      if(f(e, r, arr)) ret.push(e);
    });
    return ret;
  },

  reduce: function(a, f, s){
    s = s? f(s, a.shift(), 0) : a.shift();
    Tea.Array.forEach(a, function(e, r, arr){
      s = f(s, e, ++r);
    });
    return s;
  },

  uniq: function(a){
    return Tea.Array.reduce(a, function(e, r, arr){
      if(Tea.Array.indexOf(e,r) == -1) e.push(r);
      return e;
    }, []);
  },
}

/* Tea.Listener */
Tea.Listener = new Tea.Class({
  init: function(){
    this._listeners = {};
  },
  addEventListener: function(evt, fun){
    this._listeners[evt] = this._listeners[evt] || [];
    if(Tea.Array.indexOf(this._listeners[evt], fun) == -1)
      return this._listeners[evt].push(fun);
    return false;
  },
  removeEventListener: function(evt, fun){
    this._listeners[evt] = this._listeners[evt] || [];
    var i = Tea.Array.indexOf(this._listeners[evt], fun)
    if(i==-1) return false;
    return this._listeners[evt].splice(i, 1)
  },
});

Tea.DOM = new Tea.Class({
  getElementsByClassName: function(name, elm){
    elm || (elm = document);
    var ret = [];
    (function(e){
      var f = arguments.callee;
      Tea.Array.forEach(e.childNodes, function(a){
        if(Tea.DOM.hasClassName(a, name)) ret.push(a);
        else f(a);
      });
    })(elm);
    return Tea.Array.flatten(ret);
  },

  hasClassName: function(e, name){
    name = name.toLowerCase();
    var cn = e.className;
    if (!cn) return false;
    var cnlist = cn.toLowerCase().split(/\s+/);
    for (var i=0,l=cnlist.length;i<l;i++)
      if(cnlist[i] == name.toLowerCase()) return true;
    return false;
  },

  addClassName: function(e, name){
    var cn = e.className || '';
    if(Tea.DOM.hasClassName(e, name)) return;
    cn = cn+' '+name;
  },

  removeClassName: function(e, name){
    var cn = e.className || '';
    if(!Tea.DOM.hasClassName(e, name)) return;
    name = name.toLowerCase();
    var cnlist = cn.toLowerCase().split(/\s+/);
    cnlist.splice(Tea.Array.indexOf(cnlist, name), 1);
    e.className = cnlist.join(' ');
  },

  createDOM: function(src){
  },
});

function log(){
  if(window.console && console.info) console.info.apply(console, arguments);
}
