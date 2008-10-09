// Chain.js
// Tea.Chainから持ってきた非同期メソッドチェーン
// Firefox, Safari用に変更したもの.
// Array base の中央集中型

var Chain = function(){
  this._chain = [];
  this._res = null;
  this._type = 'ok';
  this._locked = true;
  this._state = 'still';
}
Chain.list = function(list, t){
  var ret = new Chain();
  ret.list(list, t);
  return ret.succeed();
}
Chain.hash = function(hash, t){
  var ret = new Chain();
  ret.hash(hash, t);
  return ret.succeed();
}
Chain.loop = function(n, fun, t){
  var ret= new Chain();
  for(var i=0; i<n; i++){
    ret.add(function(res){
      return fun.call(this, i);
    }, t);
  }
  return ret.succeed();
}
Chain.add = function(fun, t){
  var ret = new Chain();
  ret.add(fun, t);
  return ret.succeed();
},
Chain.later = function(time){
  var ret = new Chain();
  ret.later(time);
  return ret.succeed();
},
Chain._pair = function(){
  return this;
}
Chain._pair.prototype = {
  ok: function(res){ return res },
  er: function(res){ throw  res },
  time: 0,
  t: null
}
Chain._timer = function(){
  this.set();
}
Chain._timer.prototype = {
  stop: function(){
    return (new Date).getTime() - this.time;
  },
  set: function(){
    this.time = (new Date).getTime();
    return this.time;
  }
}

Chain.prototype = {
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
  hash: function(hash, t){ return this._list(hash, t) },
  unlock: function(res, type){ return this._unlock(res, type) },
  succeed: function(res){ return this._unlock(res, 'ok')  },
  fail:  function(res){ return this._unlock(res, 'er')  },

  // main
  _add: function(fun, type, method, t){
    var pair = new Chain._pair();
    pair.t = t;
    pair[type] = fun;
    this._chain[method](pair);
    return this;
  },
  _callbacks: function(okfun, erfun, method, t){
    var pair = new Chain._pair();
    pair.t = t;
    pair.ok = okfun;
    pair.er = erfun;
    this._chain[method](pair);
    return this;
  },
  _later: function(time, method){
    if(!(time > 0)) return this;
    var pair = new Chain._pair();
    pair.time = time*1000;
    this._chain[method](pair);
    return this;
  },
  _list: function(list, t){
    var num = list.length,
        c = 0,
        value = [];
    return this.add(function(res){
      list.forEach(function(d, index){
        if(!(d instanceof Chain)){
          var f = d;
          d = Chain.add(function(){ return f.call(this, res) }, t);
        } else if(d._state == 'done'){
          d.unlock();
        }
        d.callbacks(
        function(res){
          value[index] = [true, res];
          if(++c==num) this.succeed(value);
        },
        function(res){
          value[index] = [false, res];
          if(++c==num) this.succeed(value);
        }, this);
      }, this);
      return this.lock();
    }, this);
  },
  _hash: function(hash, t){
    var keys = [],
        values = [];
    for(var i in obj){
      keys.push(i);
      values.push(obj[i]);
    }
    return this.list(values, t).add(function(res){
      var h = {}
      res.forEach(function(e, index){
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
        timer = new Chain._timer();
    try {
      this._res = pair[this._type].call((pair.t || this), this._res);
    } catch(e) {
      this._res = e;
      this._type = 'er';
    }
    if(this._res instanceof Chain && this._res != this){
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
}

/* XHR */
var XHR = function(url, opt){
  var req = XHR.getXHR(),
      ret = new Chain(),
      params = [];
  opt        || (opt = {});
  opt.method || (opt.method = 'GET');
  opt.data   || (opt.data = {});

  for(var k in opt.data){
    if(opt.data.hasOwnProperty(k))
      params.push(encodeURIComponent(k)+'='+encodeURIComponent(opt.data[k]));
  }

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
    for(var l in opt.header){
      if(opt.header.hasOwnProperty(l))
        req.setRequestHeader(l, opt.header[l]);
    }
  }
  if(opt.method.toUpperCase()=='POST')
    req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  req.send(params);
  return ret;
}

XHR.getXHR = function(){
  for(var i=0,l=XHR.XHRs.length;i<l;i++){
    try {
      return XHR.XHRs[i]();
    } catch(e){}
  }
}

XHR.XHRs = [
  function(){ return new XMLHttpRequest(); },
  function(){ return new ActiveXObject('Msxml2.XMLHTTP'); },
  function(){ return new ActiveXObject('Microsoft.XMLHTTP'); },
  function(){ return new ActiveXObject('Msxml2.XMLHTTP.4.0'); },
]

/* JSONP */
var JSONP = function(url, opt){
  var doc = document,
      script = doc.createElement('script'),
      ret = new Chain(),
      params = [],
      name = 'callback'+(JSONP.id++);
  opt      || (opt = {});
  opt.data || (opt.data = {});

  opt.data[(opt.jsonp || 'callback')] = 'JSONP.callbacks.'+name;
  JSONP.callbacks[name] = function(json){
    delete JSONP.callbacks[name];
    doc.getElementsByTagName('head')[0].removeChild(script);
    ret.succeed(json);
  }

  for(var k in opt.data){
    if(opt.data.hasOwnProperty(k))
      params.push(encodeURIComponent(k)+'='+encodeURIComponent(opt.data[k]));
  }

  params = params.join('&');
  url += (url.indexOf('?')==-1)? '?'+params : '&'+params;

  script.type    = 'text/javascript';
  script.charset = 'utf-8';
  script.src     = url;
  doc.getElementsByTagName('head')[0].appendChild(script);

  return ret;
}
JSONP.callbacks = {};
JSONP.id = 0;

