import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// O código do design usa os globais (window.gsap / ScrollTrigger / Lenis)
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.Lenis = Lenis;

(function () {
  'use strict';
  var raiz = document.documentElement;
  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function dois(n) { return String(n).padStart(2, '0'); }

  function iniciar() {
    var temGsap = !!(window.gsap && window.ScrollTrigger) && !reduzir;
    var lenis = null;

    /* ---------- Rolagem suave (Lenis) ---------- */
    if (temGsap) {
      gsap.registerPlugin(ScrollTrigger);
      if (window.Lenis) {
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      }
    }

    /* ---------- Links internos ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var alvo = id.length > 1 ? document.querySelector(id) : null;
        if (!alvo) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(alvo, { duration: 1.4 });
        else alvo.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth' });
      });
    });

    /* ---------- Revelar ao entrar na tela ---------- */
    var revelar = document.querySelectorAll('.revelar');
    if (raiz.classList.contains('js-anim') && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-visivel'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      revelar.forEach(function (el) { io.observe(el); });
    } else {
      revelar.forEach(function (el) { el.classList.add('is-visivel'); });
    }

    /* ---------- Contador (100 mil m²) ---------- */
    var fmt = new Intl.NumberFormat('pt-BR');
    var contadores = document.querySelectorAll('[data-contar]');
    function contar(el) {
      var fim = parseInt(el.getAttribute('data-contar'), 10);
      if (reduzir) { el.textContent = fmt.format(fim); return; }
      var t0 = null, dur = 1500;
      function passo(t) {
        if (!t0) t0 = t;
        var k = Math.min((t - t0) / dur, 1);
        el.textContent = fmt.format(Math.round(fim * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    }
    if ('IntersectionObserver' in window) {
      var ioC = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) { if (en.isIntersecting) { contar(en.target); ioC.unobserve(en.target); } });
      }, { threshold: 0.6 });
      contadores.forEach(function (el) { ioC.observe(el); });
    }

    /* ---------- Lightbox (galeria e fotos dos espaços) ---------- */
    var dlg = document.getElementById('lightbox');
    var imgL = document.getElementById('lightbox-img');
    var legL = document.getElementById('lightbox-legenda');
    var listaL = [], atualL = 0;
    function mostrarL(i) {
      atualL = (i + listaL.length) % listaL.length;
      var f = listaL[atualL];
      imgL.src = f.src; imgL.alt = f.alt;
      legL.textContent = dois(atualL + 1) + ' / ' + dois(listaL.length);
    }
    function abrirL(lista, i) {
      if (!dlg || !dlg.showModal) return;
      listaL = lista; mostrarL(i || 0); dlg.showModal(); if (lenis) lenis.stop();
    }
    if (dlg && dlg.showModal) {
      dlg.querySelector('[data-fechar]').addEventListener('click', function () { dlg.close(); });
      dlg.querySelector('[data-anterior]').addEventListener('click', function () { mostrarL(atualL - 1); });
      dlg.querySelector('[data-proxima]').addEventListener('click', function () { mostrarL(atualL + 1); });
      dlg.addEventListener('close', function () { if (lenis) lenis.start(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') mostrarL(atualL + 1);
        if (e.key === 'ArrowLeft') mostrarL(atualL - 1);
      });
    }
    var itensG = Array.prototype.slice.call(document.querySelectorAll('.galeria__item'));
    var listaG = itensG.map(function (el) { var im = el.querySelector('img'); return { src: im.getAttribute('src'), alt: im.alt }; });
    itensG.forEach(function (el, i) { el.addEventListener('click', function () { abrirL(listaG, i); }); });

    /* Galeria no celular: carrossel com contador e barra */
    var gradeG = document.querySelector('[data-galeria]');
    var atualG = document.querySelector('[data-galeria-atual]');
    var barraG = document.querySelector('.galeria__barra span');
    if (gradeG && atualG && itensG.length) {
      document.querySelector('[data-galeria-total]').textContent = dois(itensG.length);
      barraG.style.width = (100 / itensG.length) + '%';
      var posG = function () {
        var esq = gradeG.getBoundingClientRect().left + (parseFloat(getComputedStyle(gradeG).paddingLeft) || 0);
        var melhor = 0, dist = Infinity;
        itensG.forEach(function (el, i) { var d = Math.abs(el.getBoundingClientRect().left - esq); if (d < dist) { dist = d; melhor = i; } });
        atualG.textContent = dois(melhor + 1);
        barraG.style.transform = 'translateX(' + (melhor * 100) + '%)';
      };
      gradeG.addEventListener('scroll', function () { window.requestAnimationFrame(posG); }, { passive: true });
      if ('IntersectionObserver' in window) {
        var ioG = new IntersectionObserver(function (entradas) {
          entradas.forEach(function (en) { en.target.classList.toggle('is-visivel', en.isIntersecting); });
        }, { root: gradeG, threshold: 0.55 });
        itensG.forEach(function (el) { ioG.observe(el); });
      } else {
        itensG.forEach(function (el) { el.classList.add('is-visivel'); });
      }
    }

    /* ---------- Espaços: abas, miniaturas e fotos ampliadas ---------- */
    var listaAbas = document.querySelector('.abas__lista');
    var abas = Array.prototype.slice.call(document.querySelectorAll('.abas__aba'));
    function selecionarAba(k, focar) {
      abas.forEach(function (a, i) {
        var ativa = i === k;
        a.setAttribute('aria-selected', ativa ? 'true' : 'false');
        a.tabIndex = ativa ? 0 : -1;
        document.getElementById(a.getAttribute('aria-controls')).hidden = !ativa;
      });
      if (focar) abas[k].focus({ preventScroll: true });
      /* no celular a barra de abas rola para o lado: mantém a aba escolhida à vista */
      if (listaAbas && listaAbas.scrollWidth > listaAbas.clientWidth) {
        listaAbas.scrollTo({ left: Math.max(0, abas[k].offsetLeft - listaAbas.offsetLeft - 24), behavior: reduzir ? 'auto' : 'smooth' });
      }
    }
    abas.forEach(function (a, i) {
      a.addEventListener('click', function () { selecionarAba(i); });
      a.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); selecionarAba((i + 1) % abas.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); selecionarAba((i - 1 + abas.length) % abas.length, true); }
      });
    });
    document.querySelectorAll('.abas__painel').forEach(function (painel) {
      var grande = painel.querySelector('.abas__foto img');
      var minis = Array.prototype.slice.call(painel.querySelectorAll('.abas__mini'));
      var fotos = minis.map(function (m) { var im = m.querySelector('img'); return { src: im.getAttribute('src'), alt: im.alt }; });
      var atual = 0;
      minis.forEach(function (m, j) {
        m.addEventListener('click', function () {
          if (j === atual) return;
          atual = j;
          minis.forEach(function (x, n) { x.classList.toggle('is-ativa', n === j); });
          grande.classList.add('is-trocando');
          setTimeout(function () { grande.src = fotos[j].src; grande.alt = fotos[j].alt; grande.classList.remove('is-trocando'); }, reduzir ? 0 : 220);
        });
      });
      painel.querySelector('.abas__foto').addEventListener('click', function () { abrirL(fotos, atual); });
    });

    /* ---------- Experiências: painel ativo ---------- */
    var paineis = Array.prototype.slice.call(document.querySelectorAll('.painel'));
    function ativarPainel(i) { paineis.forEach(function (p, k) { p.classList.toggle('is-ativo', k === i); }); }
    paineis.forEach(function (p, i) {
      p.addEventListener('mouseenter', function () { ativarPainel(i); });
      p.addEventListener('focus', function () { ativarPainel(i); });
      p.addEventListener('click', function () { ativarPainel(i); });
    });

    /* ---------- Vídeo ---------- */
    var blocoVideo = document.getElementById('video-conceito');
    if (blocoVideo) {
      var video = blocoVideo.querySelector('video');
      blocoVideo.querySelector('.video__play').addEventListener('click', function () {
        blocoVideo.classList.add('is-tocando');
        video.preload = 'auto';
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      });
    }

    if (!temGsap) return;

    /* =================== Camada GSAP =================== */
    gsap.from('[data-hero-linha]', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.1, delay: 0.15 });
    gsap.from('[data-hero]', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.15, delay: 0.5 });
    gsap.fromTo('.hero__midia img', { scale: 1.12 }, { scale: 1, duration: 2.2, ease: 'power2.out' });

    /* Vídeo abre até a largura total */
    gsap.fromTo('[data-expandir]', { clipPath: 'inset(0% 14% 0% 14%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: '#video-conceito', start: 'top 90%', end: 'top 20%', scrub: true } });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
