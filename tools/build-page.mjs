// Converte o HTML do Claude Design (/eventos-corporativos) em página Astro.
// Uso: node tools/build-page.mjs "C:\caminho\index.html"
// Gera: src/styles/bandeiras-base.css, src/styles/eventos-corporativos.css,
//       src/scripts/eventos-corporativos.js e src/pages/eventos-corporativos.astro
import { readFileSync, writeFileSync } from 'node:fs';

const origem = process.argv[2];
if (!origem) { console.error('Informe o caminho do HTML.'); process.exit(1); }
const html = readFileSync(origem, 'utf8');

const CDN = 'https://media.dmove.com.br/clients/bandeiras';
const entre = (ini, fim, de = 0) => {
  const a = html.indexOf(ini, de);
  const b = html.indexOf(fim, a + ini.length);
  if (a < 0 || b < 0) throw new Error(`Trecho não encontrado: ${ini}`);
  return html.slice(a + ini.length, b);
};

// ---------- CSS ----------
let css = entre('<style>', '</style>');
css = css.replace(/src:url\("fontes\/Nexa-Heavy\.woff2"\) format\("woff2"\), url\("fontes\/Nexa-Heavy\.ttf"\) format\("truetype"\);/,
  'src:url("/fonts/Nexa-Heavy.woff2") format("woff2");');
const marca = '/* ---------- Revelação ao rolar';
const corte = css.indexOf(marca);
if (corte < 0) throw new Error('Marcador de CSS não encontrado');
// o global.css do template pinta todo <p> de cinza claro (--text-secondary); no design o <p> herda a cor do contexto
const base = css.slice(0, corte).replace('p{margin:0}', 'p{margin:0;color:inherit;line-height:inherit}');
let resto = css.slice(corte);
// formulário (.campo) vive em form.css; o botão de WhatsApp do design é substituído pelo widget padrão
resto = resto
  .split('\n')
  .filter((l) => !/^\s*\.campo/.test(l) && !/^\s*\.whatsapp/.test(l) && !/Botão flutuante de WhatsApp/.test(l))
  .join('\n')
  .replace(/\.formulario form\{[^}]*\}\n?/g, '');
writeFileSync('src/styles/bandeiras-base.css', base.trimEnd() + '\n');
writeFileSync('src/styles/eventos-corporativos.css', resto.trimEnd() + '\n');

// ---------- Corpo ----------
const iniCorpo = html.indexOf('<a class="pular"');
const fimCorpo = html.indexOf('<a class="whatsapp"');
if (iniCorpo < 0 || fimCorpo < 0) throw new Error('Corpo não encontrado');
let corpo = html.slice(iniCorpo, fimCorpo);

// rodapé do design → componente Rodape (compartilhado com hub e bio)
corpo = corpo.replace(/<!-- =+ RODAPÉ =+ -->\s*<footer[\s\S]*?<\/footer>/, '<Rodape />');

// formulário do design → componente padrão (preset corporativo, empresa 1º campo)
corpo = corpo.replace(/<!-- Formulário no padrão Dmove[\s\S]*?-->\s*<form id="form-orcamento"[\s\S]*?<\/form>/,
  '<LeadForm id="form-orcamento" />');
if (!corpo.includes('<LeadForm')) throw new Error('Formulário do design não substituído');

// mídia: imagens/*.png|webp → CDN photos/*.webp · video/* → CDN videos/*
corpo = corpo.replace(/(src|poster)="imagens\/([^"]+?)\.(?:png|webp)"/g, `$1="${CDN}/photos/$2.webp"`);
corpo = corpo.replace(/src="video\/([^"]+)"/g, `src="${CDN}/videos/$1"`);
if (/"(?:imagens|video|fontes)\//.test(corpo)) throw new Error('Sobrou referência a arquivo local');
// Astro interpreta { } como expressão
if (/[{}]/.test(corpo.replace(/<LeadForm[^>]*>/, ''))) throw new Error('Chaves no corpo precisam de escape');

// ---------- Script ----------
let js = entre('<script>\n(function () {', '})();\n</script>');
js = '(function () {' + js + '})();\n';
const cabecalho = `import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// O código do design usa os globais (window.gsap / ScrollTrigger / Lenis)
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.Lenis = Lenis;

`;
writeFileSync('src/scripts/eventos-corporativos.js', cabecalho + js);

// ---------- Página ----------
const titulo = entre('<title>', '</title>');
const descricao = entre('<meta name="description" content="', '">');
const pagina = `---
// Gerado por tools/build-page.mjs a partir do HTML do Claude Design.
import Base from '../layouts/Base.astro';
import LeadForm from '../components/form/LeadForm.astro';
import Rodape from '../components/Rodape.astro';
import '../styles/bandeiras-base.css';
import '../styles/eventos-corporativos.css';
import '../styles/form.css';
---

<Base
  title="${titulo}"
  description="${descricao}"
  ogImage="${CDN}/photos/bandeiras-corporativo-hero-fachada.webp"
  canonical="https://eventos.bandeirasempresarial.com.br/eventos-corporativos/"
  whatsAppShowEmpresaField={true}
>
<Fragment slot="head">
  <link rel="preload" href="/fonts/Nexa-Heavy.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&family=Roboto:wght@400;500;700&display=swap" />
  <script is:inline>
    /* "js": recursos que dependem de script. "js-anim": animações de entrada, só sem pedido de movimento reduzido. */
    document.documentElement.classList.add('js');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('js-anim');
  </script>
</Fragment>
${corpo.trim()}
</Base>

<script>
  import '../scripts/eventos-corporativos.js';
</script>
`;
writeFileSync('src/pages/eventos-corporativos.astro', pagina);
console.log('OK: página, CSS e script gerados.');
