/* Roda — tema claro e escuro, compartilhado entre o site e o app
 * Carregado no <head> para aplicar a escolha salva antes da página aparecer.
 * Sem escolha salva, segue o tema do sistema.
 */
(function () {
  var CHAVE = 'roda:tema';
  var raiz = document.documentElement;
  var sistemaClaro = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  var SOL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var LUA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';

  function salvo() {
    try {
      var t = localStorage.getItem(CHAVE);
      return t === 'claro' || t === 'escuro' ? t : null;
    } catch (e) {
      return null;
    }
  }

  function atual() {
    return raiz.getAttribute('data-tema') || (sistemaClaro && sistemaClaro.matches ? 'claro' : 'escuro');
  }

  function rotulo() {
    return atual() === 'claro' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro';
  }

  function conteudo() {
    return atual() === 'claro' ? LUA : SOL;
  }

  function botao(classe) {
    return '<button class="tema-botao' + (classe ? ' ' + classe : '') + '" type="button" data-tema-botao aria-label="' + rotulo() + '" title="' + rotulo() + '">' + conteudo() + '</button>';
  }

  function atualizarPagina() {
    var fundo = getComputedStyle(raiz).getPropertyValue('--noite').trim();
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) if (fundo) metas[i].setAttribute('content', fundo);
    var botoes = document.querySelectorAll('[data-tema-botao]');
    for (var j = 0; j < botoes.length; j++) {
      botoes[j].innerHTML = conteudo();
      botoes[j].setAttribute('aria-label', rotulo());
      botoes[j].setAttribute('title', rotulo());
    }
  }

  function aplicar(tema) {
    raiz.setAttribute('data-tema', tema);
    try { localStorage.setItem(CHAVE, tema); } catch (e) { /* sem armazenamento */ }
    atualizarPagina();
    // O site mostra o app num iframe: leva a mesma escolha para dentro dele
    var quadros = document.querySelectorAll('iframe');
    for (var i = 0; i < quadros.length; i++) {
      try {
        var doc = quadros[i].contentDocument;
        if (doc) {
          doc.documentElement.setAttribute('data-tema', tema);
          if (quadros[i].contentWindow.RodaTema) quadros[i].contentWindow.RodaTema.atualizar();
        }
      } catch (e) { /* outra origem */ }
    }
  }

  var inicial = salvo();
  if (inicial) raiz.setAttribute('data-tema', inicial);

  document.addEventListener('click', function (evento) {
    if (evento.target.closest && evento.target.closest('[data-tema-botao]')) {
      aplicar(atual() === 'claro' ? 'escuro' : 'claro');
    }
  });

  if (sistemaClaro && sistemaClaro.addEventListener) {
    sistemaClaro.addEventListener('change', function () { if (!salvo()) atualizarPagina(); });
  }

  document.addEventListener('DOMContentLoaded', atualizarPagina);

  window.RodaTema = { botao: botao, atual: atual, atualizar: atualizarPagina };
})();
