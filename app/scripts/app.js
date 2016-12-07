'use strict';

//Utils
if (window.console && typeof(window.console.time) == 'undefined') {
  console.time = function (name, reset) {
    if (!name) {
      return;
    }
    const time = new Date().getTime();
    if (!console.timeCounters) {
      console.timeCounters = {};
    }
    const key = 'KEY' + name.toString();
    if (!reset && console.timeCounters[key]) {
      return;
    }
    console.timeCounters[key] = time;
  };

  console.timeEnd = function (name) {
    const time = new Date().getTime();
    if (!console.timeCounters) {
      return;
    }
    const key = 'KEY' + name.toString();
    const timeCounter = console.timeCounters[key];
    let diff;
    if (timeCounter) {
      diff = time - timeCounter;
      const label = name + ': ' + diff + 'ms';
      console.info(label);
      delete console.timeCounters[key];
    }
    return diff;
  };
}


const Gri = {
  // Runtime da tum moduller buraya atanir.
  modules: [],
  _module: null,
  valid: true,
  _debug: eval(Cookies.get('debug')),
  time: console.time('document load time')
};

let V = {};
/*
 Module icin ie kontrolu yapar.
 */
Gri.checkIEVersion = function () {
  if (is[null](this._module.ieVersion) || is.undefined(this._module.ieVersion)) {
    return this;
  }
  const ieV = this._module.ieVersion;
  const moduleIeVersion = Number(ieV.replace('<', '').replace('>', ''));
  const uA = navigator.userAgent;
  let ieVersion = null;

  if (uA.indexOf('MSIE 6') >= 0) {
    ieVersion = 6;
  }
  if (uA.indexOf('MSIE 7') >= 0) {
    ieVersion = 7;
  }
  if (document.documentMode) { // as of IE8
    ieVersion = document.documentMode;
  }


  //Ie versiyon kontrolu yapilmis mi kontrolu
  if (is.string(moduleIeVersion)) {
    this._module.ieVersion = null;
  }

  //Versiyon buyukse degilse valid keyini false eder
  if (!($.inArray('>', ieVersion) && moduleIeVersion > ieVersion)) {
    this.valid = false
  }

  //Versiyon kucukse degilse valid keyini false eder
  if (!($.inArray('<', ieVersion) && moduleIeVersion < ieVersion)) {
    this.valid = false
  }

  //Versiyon esit degilse valid keyini false eder
  if (!($.inArray('=', ieVersion) && moduleIeVersion == ieVersion)) {
    this.valid = true
  } else {
    this.valid = false
  }


  return this;
};

/*
 Module icin event atamasi yapar.
 */
Gri.setEvent = function () {
  const $el = this._module.$el;
  const container = this._module.container;
  const state = this._module.state;
  const fn = this._module.fn;

  //State atanmis ise event olarak tanimliyoruz.
  if (is.string(state)) {
    if (is.string(container) || is.object(container)) {
      $(container).bind(state, fn.bind(this._module));
    } else {
      $($el).bind(state, fn.bind(this._module));
    }
  }
  return this;
};


/*
 Debug modu kontrolu yapar.
 */
Gri.debug = function (parameter) {
  if (is.boolean(parameter)) {
    this._debug = parameter;
    Cookies.set('debug', parameter);
  } else if (is.string(parameter) && this._debug) {
    console.log(parameter, 'background: #222; color: #bada55', 'background: #222; color: #FFF', 'background: #222; color: #bada55');
  } else {
    return this._debug;
  }
};

/*
 Runtimeda tum moduller bu methodu calistirir
 */
Gri.module = function (module) {
  Gri.modules.push(module);
  Gri.moduleQueueChecker()
};

/*
 Framework icin baslatici fonksiyondur.
 */
Gri.init = function () {
  let gri = this;

  //Browser kontrolü yapılır
  Gri.browser();

  //Tum modulleri document ready de calistirir.
  let moduleSize = Gri.modules.length;
  for (let i = moduleSize; i > 0; i--) {
    //Set _module
    this._module = Gri.modules[0];
    this.valid = true;

    //Gerekli oncelik siralariyla filitreleri calistiyoruz.
    this.checkIEVersion().chain();

    //Element sayfada yoksa modul run edilmez
    if (this._module.$el.length != 0) {
      this.debug('%cModul %c' + this._module.name + ' %cBaslatildi');
      this.setEvent()
        .run();
    }

    //Gerekli islemlerden gecen 0'inci modulu siliyoruz
    delete Gri.modules[0];

    //Clone array witouth undefined
    const tmpArr = [];
    for (let x = 0; x < Gri.modules.length; x++) {
      if (!is.undefined(Gri.modules[x]) && !is[null](Gri.modules[x])) {
        tmpArr.push(Gri.modules[x]);
      }
    }
    Gri.modules = tmpArr;
    //Re-set loop size
    moduleSize = Gri.modules.length;
  }

  //Remove modules to prevent global injection
  // delete Gri.modules;
  if (eval(Cookies.get('debug'))) {
    console.timeEnd('document load time');
  }
};

/*
 Modulu calistirir.
 */
Gri.run = function () {
  const name = this._module.name;
  const fn = this._module.fn;
  const state = this._module.state;


  if ((!is.string(state) || state.indexOf('ready') > -1) && this.valid) {
    try {
      fn.call(this._module);
    } catch (e) {
      console.log(name)
      console.log(e)
    }

  }

  if (this.debug()) {
    Gri.debug('%cModul %c' + name + ' %c yuklendi.');
  }

  return this;
};

/*
 Birbirine bagli modulleri zincirler
 */
Gri.chain = function () {
  let bool = false;
  //Check if module has chains

  if (!is.string(this._module.chain) || this._module.chain == '') {
    return this;
  }

  const chains = this._module.chain.split(',');
  //Loop chains
  for (let i  in chains) {
    //if they exist in queue break and add this module on tail
    if (_.where(Gri.modules, {'name': chains[i]}).length != 0) {
      Gri.modules = _(Gri.modules).filter(function (item) {
        return item.name !== Gri._module.name;
      });
      Gri.modules.push(this._module);
      this._module = Gri.modules[0];
      bool = true;
      break;
    }
  }
  return bool;
};

/*
 Modullerin yuklenmesini bekler
 */
Gri.moduleQueueChecker = function () {
  const gri = this;
  clearTimeout(this._moduleQueueChecker);
  this._moduleQueueChecker = setTimeout(function () {
    gri.init();
  }, 1);
};

/*
 Hangi tarayıcı olduğunu class olarak html tagına ekler.
 */
Gri.browser = function () {
  const ua = navigator.userAgent.toLowerCase(),
    is = function (t) {
      return ua.indexOf(t) > -1
    },
    g = 'gecko',
    w = 'webkit',
    s = 'safari',
    o = 'opera',
    m = 'mobile',
    h = document.documentElement,
    b = [(!(/opera|webtv/i.test(ua)) && /msie\s(\d)/.test(ua)) ? ('ie ie' + RegExp.$1) : is('firefox/2') ? g + ' ff2' : is('firefox/3.5') ? g + ' ff3 ff3_5' : is('firefox/3.6') ? g + ' ff3 ff3_6' : is('firefox/3') ? g + ' ff3' : is('gecko/') ? g : is('opera') ? o + (/version\/(\d+)/.test(ua) ? ' ' + o + RegExp.$1 : (/opera(\s|\/)(\d+)/.test(ua) ? ' ' + o + RegExp.$2 : '')) : is('konqueror') ? 'konqueror' : is('blackberry') ? m + ' blackberry' : is('android') ? m + ' android' : is('chrome') ? w + ' chrome' : is('iron') ? w + ' iron' : is('applewebkit/') ? w + ' ' + s + (/version\/(\d+)/.test(ua) ? ' ' + s + RegExp.$1 : '') : is('mozilla/') ? g : '', is('j2me') ? m + ' j2me' : is('iphone') ? m + ' iphone' : is('ipod') ? m + ' ipod' : is('ipad') ? m + ' ipad' : is('mac') ? 'mac' : is('darwin') ? 'mac' : is('webtv') ? 'webtv' : is('win') ? 'win' + (is('windows nt 6.0') ? ' vista' : '') : is('freebsd') ? 'freebsd' : (is('x11') || is('linux')) ? 'linux' : '', 'js'];
  let c;
  c = b.join(' ');
  h.className += ' ' + c;
  return c;
};
Gri.debug('%c Gri Cengo Kit %c v0.2%c');
