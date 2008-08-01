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
  }
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

  first: function(arr){
    return arr[0];
  },

  last: function(arr){
    return arr[arr.length-1];
  },

  list: function(arr){
    return Array.prototype.slice.call(arr);
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
  list: function(list, time){
    var ret=new Tea.Chain(), num=list.length, c=0, value=[];
    time || (time = null);
    Tea.Array.forEach(list, function(d, index){
      d.addCallback(function(res){
        value[index] = [true, res];
        if(++c==num) ret.succeed(value, time);
      });
      d.addErrorback(function(res){
        value[index] = [false, res];
        if(++c==num) ret.succeed(value, time);
      });
    });
    return ret;
  },
  hash: function(obj, time){
    var keys=[], values=[];
    time || (time = null);
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
    }, time);
  },
  _pair: new Tea.Class({},{
    ok: function(res){ return res },
    er: function(res){ throw  res },
    time: 0,
  }),
},{
  _add: function(fun, oker, time){
    var pair = this._active = new Tea.Chain._pair();
    time && (pair.time = time);
    pair[oker] = fun;
    this._list.push(pair);
    return this;
  },
  _go: function(res, oker, t){
    var self=this, next='ok', pair=this._list.shift();
    try {
      res = pair[oker].call(this, res, t);
    } catch(e) {
      res = e;
      next = 'er';
    }
    if(res instanceof Tea.Chain){
      Tea.Array.last(res._list).time = pair.time;
      res._list = res._list.concat(this._list);
    } else if(this._list.length > 0){
      if(pair.time){
        var timer = new Tea.Util.timer();
        var id = setTimeout(function(){
          clearTimeout(id);
          self._go.call(self, res, next, timer.stop());
        }, pair.time*1000);
      }
      else this._go(res, next, pair.time);
    }
    return this;
  },
  addCallback: function(fun, time){ return this._add(fun, 'ok', time) },
  addErrorback: function(fun, time){ return this._add(fun, 'er', time) },
  later: function(time){ this._active.time = time; return this },
  succeed: function(res, time){
    var self = this, timer=null;
    res || (res = null);
    (time && timer = new Tea.Util.timer() )|| (time = 0);
    var id = setTimeout(function(){
        clearTimeout(id);
        self._go.call(self, res, 'ok', (timer)? timer.stop() : 0);
    }, time*1000);
    return this;
  },
  failed: function(res, time){
    var self = this, timer=null;
    res || (res = null);
    (time && timer = new Tea.Util.timer() )|| (time = 0);
    var id = setTimeout(function(){
        clearTimeout(id);
        self._go.call(self, res, 'er', (timer)? timer.stop() : 0);
    }, time*1000);
    return this;
  },
});

Tea.XHR = new Tea.Class({
  init: function(url, opt){
    var req=Tea.XHR.getXHR(), ret=new Tea.Chain();
    opt || (opt = {});
    opt.method || (opt.method = 'GET');
    opt.data || (opt.data = null);
    req.onreadystatechange = function(e){
      if(req.readyState == 4){
        if (req.status >= 200 && req.status < 300)
          ret.succeed(req);
        else
          ret.failed(req);
      }
    }
    req.open(opt.method, url, true);
    if(opt.overrideMimeType && req.overrideMimeType) req.overrideMimeType(opt.overrideMimeType);
    if(opt.header){
      for(var i in opt.header)
        req.setRequestHeader(i, opt.header[i]);
    }
    if(opt.method=='POST') req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.send(opt.data);
    return ret;
  },

  getXHR: function(){
    for(var i=0,l=Tea.XHR.XHRs.length;i<l;i++){
      try {
        return Tea.XHR.XHRs[i]();
      } catch(e){}
    }
  },

  XHRs: [
    function(){ return new XMLHttpRequest(); },
    function(){ return new ActiveXObject('Msxml2.XMLHTTP'); },
    function(){ return new ActiveXObject('Microsoft.XMLHTTP'); },
    function(){ return new ActiveXObject('Msxml2.XMLHTTP.4.0'); },
  ],

  }
);

Tea.Util = new Tea.Class({
  timer: new Tea.Class({
    init: function(){
      this.t = (new Date).getTime();
    }
    },{
    stop: function(){
      return (new Date).getTime() - this.t;
    })
});


function log(){
  if(window.console && console.info) console.info.apply(console, arguments);
}
