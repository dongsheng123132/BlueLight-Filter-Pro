// 多语言渲染辅助：ES5 实现，支持下拉选择语言（localStorage），并在预览环境生效
(function(){
  var STORAGE_KEYS = ['ui_lang','selectedLanguage'];

  function getSelectedLanguage() {
    for (var i = 0; i < STORAGE_KEYS.length; i++) {
      var v = localStorage.getItem(STORAGE_KEYS[i]);
      if (v && typeof v === 'string') return v;
    }
    try {
      if (window.chrome && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
        return chrome.i18n.getUILanguage();
      }
    } catch (e) {}
    return 'zh_CN';
  }

  function normalizeLang(lang) {
    var l = (lang || '').replace('-', '_');
    l = l || 'zh_CN';
    var low = l.toLowerCase();
    if (low === 'zh' || low === 'zh_cn') return 'zh_CN';
    return l;
  }

  var localeCache = {};
  function loadLocale(lang) {
    var normalized = normalizeLang(lang);
    if (localeCache[normalized]) { return Promise.resolve(localeCache[normalized]); }
    var path = '_locales/' + normalized + '/messages.json';
    var url = path;
    try {
      if (window.chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
        url = chrome.runtime.getURL(path);
      }
    } catch (e) {}
    return fetch(url)
      .then(function(res){ if (!res.ok) { throw new Error('fetch failed'); } return res.json(); })
      .then(function(json){
        localeCache[normalized] = json;
        window.__localeMessages = json; // 导出给 polyfill 使用
        return json;
      })
      .catch(function(){ return null; });
  }

  function getMessage(key) {
    var lang = getSelectedLanguage();
    return loadLocale(lang).then(function(messages){
      if (messages && messages[key] && messages[key].message) return messages[key].message;
      try {
        if (window.chrome && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
          return chrome.i18n.getMessage(key) || '';
        }
      } catch (e) {}
      return '';
    });
  }

  function applyTranslations() {
    var nodes = document.querySelectorAll('[data-i18n], [data-i18n-title], [data-i18n-placeholder]');
    var promises = [];
    for (var i = 0; i < nodes.length; i++) {
      (function(el){
        var t = el.getAttribute('data-i18n');
        if (t) { promises.push(getMessage(t).then(function(txt){ el.textContent = txt; })); }
        var tt = el.getAttribute('data-i18n-title');
        if (tt) { promises.push(getMessage(tt).then(function(txt){ el.title = txt; })); }
        var tp = el.getAttribute('data-i18n-placeholder');
        if (tp) { promises.push(getMessage(tp).then(function(txt){ el.placeholder = txt; })); }
      })(nodes[i]);
    }
    return Promise.all(promises);
  }

  window.applyTranslations = applyTranslations;
  window.getMessageAsync = getMessage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ applyTranslations(); });
  } else {
    applyTranslations();
  }
})();