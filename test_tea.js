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
    var r = 0,
        l = a.length,
        i = l%8;
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
    return (arr.length)? arr[0] : null;
  },

  last: function(arr){
    return (arr.length)? arr[arr.length-1] : null;
  },

  list: function(arr){
    return Array.prototype.slice.call(arr);
  },

  times: function(n, f){
    var r = 0,
        i = n%8;
    if(i>0) do {
      f(r++)
    } while (--i);
    i = parseInt(n >> 3)
    if(i>0) do {
      f(r++);f(r++);
      f(r++);f(r++);
      f(r++);f(r++);
      f(r++);f(r++);
    } while (--i);
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

  update: function(c, o, overwrite){
      for(var i in o)
        if(!!overwrite || !c[i]) c[i] = o[i];
      return c;
  },

  forEach: function(o, f){
    var keys = Tea.Object.keys(o);
    Tea.Array.forEach(keys, function(key, index){
      f(o[key], key, o);
    });
  },

  map: function(o, f){
    var ret = {};
    var keys = Tea.Object.keys(o);
    Tea.Array.forEach(keys, function(key){
      ret[key] = f(o[key], key, o);
    });
    return ret;
  },

  filter: function(o, f){
    var ret = {};
    var keys = Tea.Object.keys(o);
    Tea.Array.forEach(keys, function(key){
      if(f(o[key], key, o)) ret[key] = o[key];
    });
    return ret;
  }

}

/* Tea.Listener */
Tea.Listener = {
  _observers : [],
  _unloadCallback: function(){
    var l = Tea.Listener._observers;
    Tea.Array.forEach(l, function(sig, i){
      if(sig.name !== 'onload' && sig.name !== 'onunload')
      sig.disconnect();
    });
  },
  connect: function(src, name, listener){
    if(!src || !name || !listener) return null;
    var sig = new Tea.Listener.Signal({src:src, name:name, listener:listener, connected:false});
    var result = sig.connect();
    if(result){
      Tea.Listener._observers.push(result);
      return result;
    } else return null;
  },
  disconnect: function(sig){
    for(var i=0,l=Tea.Listener._observers.length;i<l;i++){
      if(Tea.Listener._observers[i] == sig){
        sig.disconnect();
        return Tea.Listener._observers.splice(i, 1);
      }
    }
    return null;
  },
  /*
   * detect(src, eventname);
   * detect(src);
   * detect(eventname);
   *
   * connected = false のものも検出
   */
  detect: function(){
    var args = arguments;
    if(args.length == 2){
      return Tea.Array.filter(Tea.Listener._observers, function(e){
        return (e.src == args[0] && e.name == args[1]);
      });
    } else if(typeof(args[0]) == 'string'){
      return Tea.Array.filter(Tea.Listener._observers, function(e){
        return (e.name == args[0]);
      });
    } else {
      return Tea.Array.filter(Tea.Listener._observers, function(e){
        return (e.src == args[0]);
      });
    }
  },

  notify: function(src, name, args){
    Tea.Array.forEach(Tea.Listener._observers, function(e){
      if(e.name == name && e.src == src && e.connected)
        e.listener.apply(src, args);
    });
  },

  /* Tea.Listener.Signal */
  Signal: new Tea.Class({
    init: function(obj){
      this.name      = obj.name;
      this.src       = obj.src;
      this.DOM       = (obj.src.addEventListener || obj.src.attachEvent)? true : false;
      this.connected = obj.connected? obj.connected : false;
      this.listener  = this.getListener(obj);
    }
    },{
    connect: function(){
      if(this.connected) return null;
      this.connected = true;
      if(this.DOM){
        if(this.src.addEventListener)
          this.src.addEventListener(this.name.substring(2), this.listener, false);
        else{
          this.src.attachEvent(this.name, this.listener);
        }
      }
      return this;
    },
    disconnect: function(){
      if(!this.connected) return null;
      this.connected = false;
      if(this.DOM){
        if(this.src.removeEventListener)
          this.src.removeEventListener(this.name.substring(2), this.listener, false);
        else
          this.src.detachEvent(this.name, this.listener);
      }
      return this;
    },
    getListener: function(obj){
      var self = this;
      if(!this.DOM){
        if(this.name == 'onload' || this.name == 'onunload'){
          return function(){
            obj.listener.apply(self.src, arguments);
            Tea.Listener.disconnect(self);
          }
        } else {
          return function(){
            obj.listener.call(self.src, arguments);
          }
        }
      } else {
        if(this.name == 'onload' || this.name == 'onunload'){
          return function(e){
            e = new Tea.Listener.Event(self.src, e);
            obj.listener.call(self.src, e);
            Tea.Listener.disconnect(self);
          }
        } else {
          return function(e){
            e = new Tea.Listener.Event(self.src, e);
            obj.listener.call(self.src, e);
          }
        }
      }
    }
  }),

  /* Tea.Listener.Event */
  Event: new Tea.Class({
    init: function(src, e){
      Tea.Object.update(this, e);
      Tea.Object.update(this, {
        target         : e.srcElement,
        currentTarget  : src,
        relatedTarget  : e.fromElement? e.fromElement : e.toElement,
        eventPhase     : (e.srcElement==src)? 2 : 3,
        stopPropagation: function(){ e.cancelBubble = true },
        preventDefault : function(){ e.returnValue  = false}
      }, false);
    }
  })
};

Tea.Listener.connect(window, 'onunload', Tea.Listener._unloadCallback);

/* Tea.DOM */
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
  }
});

/* Tea Chain
 * Array baseの中央集中型のdeferred
 */
Tea.Chain = new Tea.Class({
  init: function(){
    this._chain = [];
    this._res = null;
    this._type = 'ok';
    this._locked = true;
    this._state = 'still';
  },
  list: function(list, t){
    var ret = new Tea.Chain();
    ret.list(list, t);
    return ret.succeed();
  },
  hash: function(hash, t){
    var ret = new Tea.Chain();
    ret.hash(hash, t);
    return ret.succeed();
  },
  loop: function(n, fun, t){
    var ret= new Tea.Chain();
    Tea.Array.times(n, function(e){
      ret.add(function(res){
        return fun.call(this, e);
      }, t);
    });
    return ret.succeed();
  },
  add: function(fun, t){
    var ret = new Tea.Chain();
    ret.add(fun, t);
    return ret.succeed();
  },
  later: function(time){
    var ret = new Tea.Chain();
    ret.later(time);
    return ret.succeed();
  },
  _pair: new Tea.Class({},{
    ok: function(res){ return res },
    er: function(res){ throw  res },
    time: 0,
    t: null
  }),
  _timer: new Tea.Class({
    init: function(){
      this.set();
    }
    },{
    stop: function(){
      return (new Date).getTime() - this.time;
    },
    set: function(){
      this.time = (new Date).getTime();
      return this.time;
    }
  })
},{
  // available methods
  add:  function(fun, t){ return this._add(fun, 'ok', 'push', t) },
  error: function(fun, t){ return this._add(fun, 'er', 'push', t) },
  callbacks: function(okfun, erfun, t){ return this._callbacks(okfun, erfun, 'push', t) },
  both: function(fun, t){ return this._callbacks(fun, fun, 'push', t) },
  addUnshift:  function(fun, t){ return this._add(fun, 'ok', 'unshift', t) },
  errorUnshift: function(fun, t){ return this._add(fun, 'er', 'unshift', t) },
  later: function(time, method){ return this._later(time, 'push') },
  laterUnshift: function(time, method){ return this._later(time, 'unshift') },
  lock: function(){ return this._lock() },
  list: function(list, t){ return this._list(list, t) },
  hash: function(hash, t){ return this._hash(hash, t) },
  unlock: function(res, type){ return this._unlock(res, type) },
  succeed: function(res){ return this._unlock(res, 'ok')  },
  fail:  function(res){ return this._unlock(res, 'er')  },

  // main
  _add: function(fun, type, method, t){
    var pair = new Tea.Chain._pair();
    pair.t = t;
    pair[type] = fun;
    this._chain[method](pair);
    return this;
  },
  _callbacks: function(okfun, erfun, method, t){
    var pair = new Tea.Chain._pair();
    pair.t = t;
    pair.ok = okfun;
    pair.er = erfun;
    this._chain[method](pair);
    return this;
  },
  _later: function(time, method){
    if(!(time > 0)) return this;
    var pair = new Tea.Chain._pair();
    pair.time = time*1000;
    this._chain[method](pair);
    return this;
  },
  _list: function(list, t){
    var num = list.length,
        c = 0,
        value = [];
    return this.add(function(res){
      var self = this;
      Tea.Array.forEach(list, function(d, index){
        if(!(d instanceof Tea.Chain)){
          var f = d;
          d = Tea.Chain.add(function(){ return f.call(this, res) }, t);
        } else if(d._state == 'done'){
          d.unlock();
        }
        d.callbacks(
        function(res){
          value[index] = [true, res];
          if(++c==num) self.succeed(value);
        },
        function(res){
          value[index] = [false, res];
          if(++c==num) self.succeed(value);
        });
      });
      return this.lock();
    }, this);
  },
  _hash: function(hash, t){
    var keys = Tea.Object.keys(hash),
        values = Tea.Array.map(keys, function(key){ return hash[key] });
    return this.list(values, t).add(function(res){
      var h = {}
      Tea.Array.forEach(res, function(e, index){
        h[keys[index]]=e;
      });
      return h
    });
  },
  _lock: function(){
    this._locked = true;
    return this;
  },
  _unlock: function(res, type){
    var self = this;
    res && (this._res = res);
    type && (this._type = type);
    this._state = 'process';
    this._locked = false;
    var id = setTimeout(function(){
        id && clearTimeout(id);
        self._go.call(self);
    }, 0);
    return this;
  },
  _go: function(){
    if(this._locked) return this;
    var pair = this._chain.shift(),
        timer = new Tea.Chain._timer();
    try {
      this._res = pair[this._type].call((pair.t || this), this._res);
    } catch(e) {
      this._res = e;
      this._type = 'er';
    }
    if(this._res instanceof Tea.Chain && this._res != this){
      this.lock().laterUnshift(pair.time);
      this._res.both(function(res){ this.succeed(res) }, function(res){ this.fail(res) }, this);
      if(this._res._locked) this._res.unlock();
      this._res = null;
    } else if(this._chain.length > 0){
      if(pair.time){
        var tmp, self = this,
        id = setTimeout(function(){
          id && clearTimeout(id);
          self._go.call(self);
        }, ((tmp = pair.time - timer.stop()) < 0)? 0 : tmp);
      }
      else this._go();
    } else {
      this._state = 'done';
      this.lock();
    }
    return this;
  }
});

/* Tea.XHR */
Tea.XHR = new Tea.Class({
  init: function(url, opt){
    var req = Tea.XHR.getXHR(),
        ret = new Tea.Chain(),
        params = [];
    opt        || (opt = {});
    opt.method || (opt.method = 'GET');
    opt.data   || (opt.data = {});

    Tea.Object.forEach(opt.data, function(v, k, o){
      if(o.hasOwnProperty(k))
        params.push(encodeURIComponent(k)+'='+encodeURIComponent(v));
    });
    params = params.join('&');

    req.onreadystatechange = function(e){
      if(req.readyState == 4){
        if (req.status >= 200 && req.status < 300)
          ret.succeed(req);
        else
          ret.fail(req);
      }
    }
    req.open(opt.method, url, true);
    if(opt.overrideMimeType && req.overrideMimeType)
      req.overrideMimeType(opt.overrideMimeType);
    if(opt.header){
      Tea.Object.forEach(opt.header, function(v, k, o){
        if (o.hasOwnProperty(k))
          req.setRequestHeader(k, v);
      });
    }
    if(opt.method.toUpperCase()=='POST')
      req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    req.send(params);
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
  ]
});

/* Tea.JSONP */
Tea.JSONP = new Tea.Class({
  init: function(url, opt){
    var doc = document,
        script = doc.createElement('script'),
        ret = new Tea.Chain(),
        params = [],
        name = 'callback'+(Tea.JSONP.id++);
    opt      || (opt = {});
    opt.data || (opt.data = {});

    opt.data[(opt.jsonp || 'callback')] = 'Tea.JSONP.callbacks.'+name;
    Tea.JSONP.callbacks[name] = function(json){
      delete Tea.JSONP.callbacks[name];
      doc.getElementsByTagName('head')[0].removeChild(script);
      ret.succeed(json);
    }

    Tea.Object.forEach(opt.data, function(v, k, o){
      if(o.hasOwnProperty(k))
        params.push(encodeURIComponent(k)+'='+encodeURIComponent(v));
    });
    params = params.join('&');
    url += (url.indexOf('?')==-1)? '?'+params : '&'+params;

    script.type    = 'text/javascript';
    script.charset = 'utf-8';
    script.src     = url;
    doc.getElementsByTagName('head')[0].appendChild(script);

    return ret;
  },
  callbacks: {},
  id: 0
});



/* Tea.Cookie */
/*
Tea.Cookie = new Tea.Class({
  init: function(){
    this.cookie = {};
    this.toHash();
  },
  calculateExpire: function(){
    calculate((new Date).getTime());
  }
  },{
  toHash: function(){
    var arr = document.cookie.split(';\s*'),
        self = this;
    Tea.Array.forEach(arr, function(e){
      e = e.replace(/^\s*|\s*$/gi, '');
      if(/([^=]*)=(.*)/.test(e))
        self.cookie[decodeURIComponent(RegExp.$1)] = decodeURIComponent(RegExp.$2);
    });
  },
  toCookie: function(){
    var ret = [];
    for(var key in this.cookie){
      ret.push(encodeURIComponent(key)+'='+encodeURIComponent(obj[key]));
    }
    document.cookie = ret.join(';');
  }
  set: function(key, value){
    this.cookie[key] = value;
    this.toCookie();
  }
  get: function(key){
    return key? this.cookie[key] : this.cookie;
  },
});
*/
function log(){
  if(window.console && console.info) console.info.apply(console, arguments);
}

