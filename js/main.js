/* Zenit Dental — scripturi (jQuery + Bootstrap 5) */
jQuery(function ($) {
  'use strict';

  var CFG = window.ZD_CONFIG || {};
  var tel = CFG.phoneTel || '';
  var telLink = '<a href="tel:' + tel + '">' + (CFG.phone || '') + '</a>';

  /* ---------- AN CURENT ÎN FOOTER ---------- */
  $('[data-year]').text(new Date().getFullYear());

  /* ---------- MENIU MOBIL (Bootstrap Offcanvas) ----------
     La click pe un link, închidem întâi meniul, apoi navigăm,
     ca pagina să poată derula la secțiunea aleasă. */
  var $dr = $('#dr');
  if ($dr.length) {
    $dr.on('click', 'a.dlink', function (e) {
      var href = $(this).attr('href');
      if (!href) return;
      e.preventDefault();
      $dr.one('hidden.bs.offcanvas', function () { window.location.href = href; });
      bootstrap.Offcanvas.getOrCreateInstance($dr[0]).hide();
    });
  }

  /* ---------- ANIMAȚII LA SCROLL ---------- */
  var $anim = $('.reveal, .reveal-left, .reveal-right, .stagger');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      $.each(entries, function (_, en) {
        if (en.isIntersecting) { $(en.target).addClass('visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    $anim.each(function () { io.observe(this); });
  } else {
    $anim.addClass('visible');
  }

  /* ---------- CONSIMȚĂMÂNT COOKIES ---------- */
  var KEY = 'zd-consent';

  function readConsent() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }

  function storeConsent(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* stocare indisponibilă */ }
  }

  function loadMaps() {
    $('[data-map]').each(function () {
      var $w = $(this);
      if ($w.find('iframe').length) return;
      $('<iframe>', {
        src: $w.data('map'),
        title: $w.data('title') || 'Hartă',
        loading: 'lazy',
        referrerpolicy: 'strict-origin-when-cross-origin',
        allowfullscreen: ''
      }).appendTo($w.empty());
    });
  }

  function loadAnalytics() {
    var id = CFG.gaId;
    if (!id || /X{4,}/.test(id) || window.__zdGa) return;
    window.__zdGa = true;
    $('<script>', { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id) })
      .appendTo('head');
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }

  function applyConsent(c) {
    if (!c) return;
    if (c.maps) loadMaps();
    if (c.analytics) loadAnalytics();
  }

  var $ck = $('#cookie');

  function showBanner(withOptions) {
    var c = readConsent() || {};
    $('#ck-map').prop('checked', !!c.maps);
    $('#ck-an').prop('checked', !!c.analytics);
    $('#ck-opts, #ck-save').toggleClass('d-none', !withOptions);
    $('#ck-toggle').toggleClass('d-none', !!withOptions);
    $ck.removeClass('d-none');
  }

  function saveConsent(c) {
    var prev = readConsent() || {};
    c.ts = new Date().toISOString();
    storeConsent(c);
    $ck.addClass('d-none');
    // dacă a retras un acord pentru ceva deja încărcat, reîncărcăm pagina ca să-l oprim
    if ((prev.maps && !c.maps) || (prev.analytics && !c.analytics)) window.location.reload();
    else applyConsent(c);
  }

  if ($ck.length) {
    $ck.on('click', '[data-c]', function () {
      switch ($(this).data('c')) {
        case 'all': saveConsent({ maps: true, analytics: true }); break;
        case 'necessary': saveConsent({ maps: false, analytics: false }); break;
        case 'save': saveConsent({ maps: $('#ck-map').is(':checked'), analytics: $('#ck-an').is(':checked') }); break;
        case 'toggle': showBanner(true); break;
      }
    });

    var current = readConsent();
    if (current) applyConsent(current); else showBanner(false);
  }

  $(document).on('click', '[data-cookie-settings]', function () { showBanner(true); });

  // „Afișează harta” = acord pentru hartă
  $(document).on('click', '[data-load-map]', function () {
    var c = readConsent() || { analytics: false };
    c.maps = true;
    c.ts = new Date().toISOString();
    storeConsent(c);
    $('#ck-map').prop('checked', true);
    loadMaps();
  });

  /* ---------- FORMULAR PROGRAMARE ---------- */
  var $f = $('#f');
  if ($f.length) {
    var $msg = $('#fmsg');
    var $btn = $f.find('button[type="submit"]');
    var label = $btn.text();

    // nu se pot alege date din trecut
    var t = new Date();
    t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    $('#d').attr('min', t.toISOString().slice(0, 10));

    var show = function (type, html) { $msg.attr('class', 'fmsg ' + type).html(html); };

    $f.on('submit', function (e) {
      e.preventDefault();
      var form = this;
      $f.addClass('was-validated');

      if (!form.checkValidity()) {
        show('err', 'Te rugăm să completezi câmpurile marcate și să bifezi acordul.');
        $f.find(':invalid').first().trigger('focus');
        return;
      }

      if (!form.action || form.action.indexOf('YOUR_FORM_ID') !== -1) {
        show('err', 'Formularul online nu este încă activ. Te rugăm să ne suni la ' + telLink + '.');
        return;
      }

      $btn.prop('disabled', true).text('Se trimite…');
      show('', '');

      $.ajax({
        url: form.action,
        method: 'POST',
        data: $f.serialize(),
        dataType: 'json',
        headers: { Accept: 'application/json' }
      }).done(function () {
        form.reset();
        $f.removeClass('was-validated');
        show('ok', 'Mulțumim! Am primit solicitarea și te sunăm în cel mai scurt timp pentru confirmare.');
        $btn.text('Solicitare trimisă');
      }).fail(function () {
        show('err', 'Solicitarea nu a putut fi trimisă. Încearcă din nou sau sună-ne la ' + telLink + '.');
        $btn.prop('disabled', false).text(label);
      });
    });
  }
});
