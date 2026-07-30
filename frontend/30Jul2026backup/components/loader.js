/**
 * Yoganteek Component Loader (v2)
 * Loads shared header and footer into #site-header and #site-footer divs.
 * Uses fetch API with inline fallback if XHR fails.
 */
(function() {
  'use strict';

  // Detect base path from loader.js src attribute
  var scripts = document.getElementsByTagName('script');
  var basePath = './components/';
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('loader.js') !== -1) {
      basePath = src.replace('loader.js', '');
      break;
    }
  }

  // Check if Tailwind is already loaded
  if (!document.querySelector('script[src="https://cdn.tailwindcss.com"]')) {
    var tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com';
    tailwindScript.onload = function() {
      if (!document.querySelector('script:not([src]):contains("tailwind.config"]')) {
        var configScript = document.createElement('script');
        configScript.textContent = 'tailwind.config={theme:{extend:{colors:{corp:{sage:"#C8B8D4",sagedark:"#5A4A72",sagelight:"#F0EAF5",sagewash:"#F7F4FB",forest:"#6B5B8A",cream:"#FAF7F2",creamdark:"#F0ECE6",warmbrown:"#8B7355",gold:"#C89B3C"}},fontFamily:{serif:["Cormorant Garamond","Georgia","serif"],sans:["DM Sans","sans-serif"]}}}}';
        document.head.appendChild(configScript);
      }
    };
    document.head.appendChild(tailwindScript);
  }

  // Execute scripts found in loaded HTML content
  function executeScripts(container) {
    var scripts = container.querySelectorAll('script');
    scripts.forEach(function(oldScript) {
      var newScript = document.createElement('script');
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      // Copy attributes
      for (var i = 0; i < oldScript.attributes.length; i++) {
        newScript.setAttribute(oldScript.attributes[i].name, oldScript.attributes[i].value);
      }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  // Load component using fetch, with XHR fallback
  function loadComponent(file, targetId, callback) {
    var target = document.getElementById(targetId);
    if (!target) {
      console.warn('[Loader] Target #' + targetId + ' not found');
      if (callback) callback();
      return;
    }

    var url = basePath + file;

    // Try fetch first
    if (typeof fetch !== 'undefined') {
      fetch(url)
        .then(function(response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.text();
        })
        .then(function(html) {
          target.innerHTML = html;
          executeScripts(target);
          if (callback) callback();
        })
        .catch(function(err) {
          console.warn('[Loader] fetch failed for ' + url + ':', err.message);
          loadWithXHR(target, url, callback);
        });
    } else {
      loadWithXHR(target, url, callback);
    }
  }

  // XHR fallback
  function loadWithXHR(target, url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          target.innerHTML = xhr.responseText;
          executeScripts(target);
        } else {
          console.warn('[Loader] XHR failed for ' + url + ': status ' + xhr.status);
        }
        if (callback) callback();
      }
    };
    xhr.onerror = function() {
      console.warn('[Loader] XHR network error for ' + url);
      if (callback) callback();
    };
    xhr.send();
  }

  // Load header first, then footer, then fire callback
  function loadComponents(callback) {
    loadComponent('header.html', 'site-header', function() {
      loadComponent('footer.html', 'site-footer', function() {
        if (callback) callback();
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
      });
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
  } else {
    loadComponents();
  }
})();
