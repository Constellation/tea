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

/* Tea.Object */
Tea.Object = {
  keys: function(obj){
    var ret = [];
    for(var i in obj) ret.push(i);
    return ret;
  },
  values: function(obj){
    var ret = [];
    for(var i in obj) ret.push(obj[i]);
    return ret;
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

Tea.Selector = {};

/* Tea Chain */
Tea.Chain = new Tea.Class({
  init: function(){
    this._list = [];
    this._active = null;
  },
  list: function(list){
    var ret=new Tea.Chain(), num=list.length, c=0, value=[];
    Tea.Array.forEach(list, function(d, index){
      d.addCallback(function(res){
        value[index] = [true, res];
        if(++c==num) ret.succeed(value);
      });
    });
    return ret;
  },
  hash: function(obj){
    var keys=[], values=[];
    for (var i in obj){
      keys.push(i);
      values.push(obj[i]);
    }
    return Tea.Chain.list(values).addCallback(function(res){
      var h = {}
      Tea.Array.forEach(res, function(e, index){
        h[keys[index]]=e;
      });
      return h
    });
  },
},{
  _add: function(fun, okng){
    var pair = new this._pair();
    this._active = pair[okng] = fun;
    this._list.push(pair);
    return this;
  },
  _pair: function(){
    return {
      ok: function(res){return res},
      error: function(res){throw res}
    }
  },
  _go: function(res, okng, t){
    var self=this, next='ok', pair=this._list.shift();
    try {
      res = pair[okng].call(this, res, t);
    } catch(e) {
      res = e;
      next = 'er';
    }
    if(res instanceof Tea.Chain){
      res._list = res._list.concat(this._list);
    }else if(this._list.length > 0){
      if(this._list[0].time){
        var time = (new Date).getTime();
        var id = setTimeout(function(){
          clearTimeout(id);
          self._go.call(self, res, next, (new Date).getTime() - time);
        }, this._list[0].time*1000)
      else this._go(res, next, 0);
    }
    return this;
  },
  addCallback: function(fun, time){ return this._add(fun, 'ok', time) },
  addErrorback: function(fun, time){ return this._add(fun, 'er', time) },
  later: function(time){ this._active.time = time;return this },
  succeed: function(res){
    var self = this;
    var id = setTimeout(function(){
        clearTimeout(id);
        self._go.call(self, res, 'ok');
    }, 0);
  },
  failed: function(res){
    var self = this;
    var id = setTimeout(function(){
        clearTimeout(id);
        self._go(res, 'er');
    }, 0);
  },
}

function log(){
  if(window.console && console.info) console.info.apply(console, arguments);
}
