/* Roda — app (JavaScript puro, sem build)
 * Rotas por hash: #/  #/quiz  #/roda  #/inicio  #/agenda  #/ritual  #/revelacao  #/cuidado  #/perfil
 * Os dados ficam só no navegador da pessoa (localStorage).
 */
(function () {
  'use strict';

  var CHAVE = 'roda:v1';
  var LOGO = '../assets/img/logo-neon.png';

  /* ---------- Estado ---------- */

  function estadoPadrao() {
    return {
      nome: '',
      respostas: {},
      onboarded: false,
      inicio: null,
      presencas: 0,
      carta: 0,
      escolhas: [],
      revelado: false,
      reservas: [],
      fila: [],
      filtro: 'pravoce',
      assinante: false
    };
  }

  function carregar() {
    try {
      var salvo = JSON.parse(localStorage.getItem(CHAVE));
      return Object.assign(estadoPadrao(), salvo || {});
    } catch (e) {
      return estadoPadrao();
    }
  }

  var estado = carregar();
  var passoQuiz = 0;
  var ultimaRota = null;

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) {
      /* navegação privada sem armazenamento: o app segue funcionando nesta sessão */
    }
  }

  function atualizar(mudancas) {
    Object.assign(estado, mudancas);
    salvar();
    render();
  }

  function ir(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  /* ---------- Utilidades ---------- */

  function esc(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function svg(conteudo, tamanho, traco) {
    tamanho = tamanho || 20;
    return '<svg width="' + tamanho + '" height="' + tamanho + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (traco || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + conteudo + '</svg>';
  }

  var ICONE = {
    voltar: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    seta: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pino: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
    pessoas: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.3 0 4 1.5 4.5 4"/>',
    casa: '<path d="M4 10l8-6 8 6v10H4z"/><path d="M10 20v-6h4v6"/>',
    roda: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="4" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="4" cy="12" r="1.5"/>',
    coracao: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    escudo: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    escudoMais: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M12 9v6"/><path d="M9 12h6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    conversa: '<path d="M4 6h16v10H8l-4 4z"/><path d="M8 10h8"/><path d="M8 13h5"/>',
    grafico: '<path d="M4 19h16"/><path d="M7 15l4-4 3 3 5-6"/>',
    balao: '<path d="M8 9h8"/><path d="M8 13h6"/><path d="M12 3a9 9 0 1 0 7.5 14L21 21l-4-1.5A9 9 0 0 0 12 3z"/>',
    estrela: '<path d="M12 3l1.8 4.7L19 9l-4 3.3 1.2 5.2L12 15l-4.2 2.5L9 12.3 5 9l5.2-1.3z"/>',
    cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    mais: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    presente: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9"/><path d="M12 8v13"/><path d="M12 8c-1.5-3-5-3.5-5-1s3 1 5 1c2 0 5 1.5 5-1s-3.5-2-5 1z"/>',
    menos: '<path d="M5 12h14"/>'
  };

  function icone(nome, tamanho, traco) {
    return svg(ICONE[nome], tamanho, traco);
  }

  var avisoTimer = null;
  function avisar(mensagem) {
    var el = document.getElementById('aviso');
    if (!el) return;
    el.textContent = mensagem;
    el.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () {
      el.classList.remove('visivel');
    }, 2600);
  }

  /* ---------- Conteúdo ---------- */

  var PERGUNTAS = [
    {
      id: 'interesses', tema: 'Interesses', multi: true,
      pergunta: 'O que você curte fazer no tempo livre?',
      dica: 'Escolha até 3. Usamos isso para formar sua roda e sugerir salas.',
      opcoes: [
        ['cinema', 'Cinema e séries'], ['musica', 'Música ao vivo'], ['esporte', 'Futebol, corrida e esportes'],
        ['gastro', 'Bares e gastronomia'], ['leitura', 'Leitura e escrita'], ['jogos', 'Jogos de tabuleiro']
      ]
    },
    {
      id: 'regiao', tema: 'Bairro',
      pergunta: 'Em que região você prefere encontrar a galera?',
      dica: 'Mostramos locais parceiros perto de você.',
      opcoes: [['centro', 'Centro'], ['oeste', 'Zona Oeste'], ['sul', 'Zona Sul'], ['norte', 'Zona Norte'], ['leste', 'Zona Leste']]
    },
    {
      id: 'horario', tema: 'Horários',
      pergunta: 'Quando você costuma ter tempo livre?',
      dica: 'Sua roda se encontra sempre no mesmo dia e horário.',
      opcoes: [
        ['semana', 'Segunda a quinta, à noite', 'A partir das 19h'], ['sexta', 'Sexta à noite', 'A partir das 19h'],
        ['sabado', 'Sábado à tarde', 'Entre 14h e 18h'], ['domingo', 'Domingo de manhã', 'Entre 9h e 12h']
      ]
    },
    {
      id: 'energia', tema: 'Energia social',
      pergunta: 'Qual é a sua energia social?',
      dica: 'A gente equilibra os perfis para todo mundo conversar.',
      opcoes: [
        ['intro', 'Introvertido', 'Prefiro ouvir antes de falar'], ['meio', 'Meio-termo', 'Depende do dia e do grupo'],
        ['extro', 'Extrovertido', 'Puxo assunto com facilidade']
      ]
    },
    {
      id: 'local', tema: 'Local',
      pergunta: 'Onde você fica mais à vontade?',
      dica: 'Os encontros são sempre em locais públicos parceiros.',
      opcoes: [['cafe', 'Café', 'Conversa tranquila'], ['bar', 'Bar', 'Clima descontraído'], ['parque', 'Parque', 'Ao ar livre, com atividade']]
    }
  ];

  var TOTAL_PASSOS = PERGUNTAS.length + 1; // nome + perguntas

  var HORARIOS = {
    semana: { dia: 2, nome: 'Terças', hora: '19h00' },
    sexta: { dia: 5, nome: 'Sextas', hora: '19h00' },
    sabado: { dia: 6, nome: 'Sábados', hora: '15h00' },
    domingo: { dia: 0, nome: 'Domingos', hora: '10h00' }
  };

  var BAIRROS = { centro: 'República', oeste: 'Pinheiros', sul: 'Vila Mariana', norte: 'Santana', leste: 'Tatuapé' };
  var LOCAIS = { cafe: 'Café parceiro', bar: 'Bar parceiro', parque: 'Parque parceiro' };

  var OUTROS = [
    ['Bruno', 'Corrida de rua'], ['Camila', 'Clube do livro'], ['Diego', 'Jogos de tabuleiro'],
    ['Helena', 'Cozinha vegana'], ['Rafael', 'Samba e choro']
  ];
  var ESCOLHERAM_VOCE = ['Camila', 'Diego', 'Rafael']; // simulação para o protótipo

  var TEMAS = ['Histórias', 'Uma atividade juntos', 'Algo que você ama', 'Rolê planejado pelo grupo'];

  var CARTAS = [
    [
      ['Para começar', 'Conte de onde você veio e o que te trouxe para esta cidade.', 'Cerca de 3 minutos por pessoa'],
      ['Pergunta para a roda', 'Qual foi a melhor coisa que aconteceu com você este ano?', 'Uma resposta por pessoa'],
      ['Para fechar', 'Cada um diz algo que quer fazer na cidade e ainda não fez.', 'Anotem: pode virar o rolê da semana 4']
    ],
    [
      ['Para começar', 'Escolham uma atividade rápida: um jogo de cartas, um desafio de desenho ou um quiz.', 'Cerca de 15 minutos'],
      ['Durante', 'Formem duplas com quem você ainda conversou pouco e troquem a cada rodada.', 'Troca de dupla a cada rodada'],
      ['Para fechar', 'O que te surpreendeu em alguém da roda hoje?', 'Uma frase por pessoa']
    ],
    [
      ['Para começar', 'Cada pessoa apresenta algo que ama: um livro, uma música, um lugar ou uma receita.', 'Cerca de 3 minutos por pessoa'],
      ['Pergunta para a roda', 'O que isso revela sobre você que a gente ainda não sabia?', 'Uma pergunta por pessoa'],
      ['Para fechar', 'Escolham juntos uma das coisas apresentadas para viver em grupo na semana 4.', 'Decisão em grupo']
    ],
    [
      ['Para começar', 'Revejam as ideias das semanas anteriores e escolham um rolê para fazer juntos.', 'Cerca de 10 minutos'],
      ['Mão na massa', 'Definam dia, lugar e quem cuida de cada parte. Vale usar uma das salas do app.', 'Todo mundo com uma tarefa'],
      ['Para fechar', 'Depois deste encontro, abre a revelação: com quem você quer manter contato?', 'A escolha é secreta']
    ]
  ];

  var SALAS = [
    { id: 'futebol', cat: 'esporte', interesse: 'esporte', tipo: 'Esporte', titulo: 'Pelada de quarta: futebol society', dia: 3, hora: '20h00', local: 'Quadra parceira, Vila Madalena', ocupadas: 4 },
    { id: 'samba', cat: 'bar', interesse: 'musica', tipo: 'Bar', titulo: 'Roda de samba e chope', dia: 4, hora: '19h00', local: 'Bar parceiro, Pinheiros', ocupadas: 5 },
    { id: 'cinema', cat: 'cinema', interesse: 'cinema', tipo: 'Cinema', titulo: 'Sessão de cinema e conversa depois', dia: 5, hora: '19h30', local: 'Cinema parceiro, Av. Paulista', ocupadas: 3 },
    { id: 'jogos', cat: 'jogos', interesse: 'jogos', tipo: 'Jogos', titulo: 'Noite de jogos de tabuleiro', dia: 2, hora: '20h00', local: 'Café parceiro, Consolação', ocupadas: 6 },
    { id: 'corrida', cat: 'esporte', interesse: 'esporte', tipo: 'Esporte', titulo: 'Corrida leve de 5 km', dia: 6, hora: '8h00', local: 'Parque Ibirapuera, portão 3', ocupadas: 2 },
    { id: 'pizza', cat: 'bar', interesse: 'gastro', tipo: 'Comida', titulo: 'Noite da pizza artesanal', dia: 5, hora: '20h30', local: 'Pizzaria parceira, Bela Vista', ocupadas: 3 },
    { id: 'livro', cat: 'cultura', interesse: 'leitura', tipo: 'Cultura', titulo: 'Clube do livro relâmpago', dia: 0, hora: '16h00', local: 'Livraria parceira, Centro', ocupadas: 1 }
  ];

  var FILTROS = [
    ['pravoce', 'Pra você'], ['todas', 'Todas'], ['esporte', 'Esporte'], ['bar', 'Bares e comida'],
    ['cinema', 'Cinema'], ['jogos', 'Jogos'], ['cultura', 'Cultura']
  ];

  var DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function rotulo(perguntaId, opcaoId) {
    var p = PERGUNTAS.filter(function (x) { return x.id === perguntaId; })[0];
    if (!p) return '';
    var o = p.opcoes.filter(function (x) { return x[0] === opcaoId; })[0];
    return o ? o[1] : '';
  }

  function resposta(id) {
    var r = estado.respostas[id];
    return Array.isArray(r) ? r : r ? [r] : [];
  }

  function proximoDia(diaSemana, aPartirDe) {
    var d = new Date(aPartirDe);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    while (d.getDay() !== diaSemana) d.setDate(d.getDate() + 1);
    return d;
  }

  function formatarData(data, hora) {
    return DIAS[data.getDay()] + ', ' + data.getDate() + ' ' + MESES[data.getMonth()] + ' às ' + hora;
  }

  function infoRoda() {
    var h = HORARIOS[resposta('horario')[0]] || HORARIOS.semana;
    var bairro = BAIRROS[resposta('regiao')[0]] || 'Pinheiros';
    var local = LOCAIS[resposta('local')[0]] || 'Café parceiro';
    var base = estado.inicio ? new Date(estado.inicio) : new Date();
    var primeira = proximoDia(h.dia, base);
    var encontros = TEMAS.map(function (tema, i) {
      var d = new Date(primeira);
      d.setDate(d.getDate() + i * 7);
      return { tema: tema, data: formatarData(d, h.hora) };
    });
    return { horario: h, bairro: bairro, local: local, encontros: encontros };
  }

  function primeiroNome() {
    return estado.nome.trim() || 'Você';
  }

  /* ---------- Componentes ---------- */

  function anel(presencas) {
    var segmentos = [
      'M52.79 10.10 A40 40 0 0 1 89.90 47.21',
      'M89.90 52.79 A40 40 0 0 1 52.79 89.90',
      'M47.21 89.90 A40 40 0 0 1 10.10 52.79',
      'M10.10 47.21 A40 40 0 0 1 47.21 10.10'
    ];
    var trilha = segmentos.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    var acesos = segmentos.map(function (d, i) {
      if (i < presencas) {
        return '<path d="' + d + '" pathLength="100"' + (i === presencas - 1 ? ' class="seg-acender"' : '') + '/>';
      }
      if (i === presencas) return '<path d="' + d + '" class="seg-proximo"/>';
      return '';
    }).join('');
    return '<svg viewBox="0 0 100 100" fill="none" stroke-width="7" stroke-linecap="round" aria-hidden="true">' +
      '<g stroke="#232c1f">' + trilha + '</g><g stroke="#c8ff3e">' + acesos + '</g></svg>';
  }

  function miniAnel(presencas) {
    return anel(presencas).replace('<svg ', '<svg class="mini-anel" ');
  }

  function navApp(atual) {
    var itens = [
      ['inicio', 'Início', 'casa'],
      ['agenda', 'Minha roda', 'roda'],
      ['cuidado', 'Cuidado', 'coracao'],
      ['perfil', 'Perfil', 'pessoas']
    ];
    return '<nav class="nav-app" aria-label="Navegação principal">' + itens.map(function (it) {
      return '<a href="#/' + it[0] + '"' + (it[0] === atual ? ' aria-current="page"' : '') + '>' + icone(it[2], 20, 2.2) + it[1] + '</a>';
    }).join('') + '</nav>';
  }

  function btnVoltar(destino, rotuloAcessivel) {
    return '<a class="btn-icone" href="' + destino + '" aria-label="' + rotuloAcessivel + '">' + icone('voltar') + '</a>';
  }

  function tela(conteudo) {
    return '<main class="tela" id="conteudo" tabindex="-1">' + conteudo + '</main>';
  }

  /* ---------- Telas ---------- */

  function telaBoasVindas() {
    return tela(
      '<div class="topo"><span class="marca"><img src="' + LOGO + '" alt=""><span>roda</span></span></div>' +
      '<div class="bv-logo"><img src="' + LOGO + '" width="200" height="200" alt="Logo da Roda: seis pessoas de mãos dadas formando um círculo"></div>' +
      '<h1 class="titulo" style="margin-top:0">Amizade não acontece por acaso. <span class="destaque-lima">Acontece por repetição.</span></h1>' +
      '<p class="texto-apoio">Um grupo fixo de seis pessoas, quatro encontros no mesmo lugar e horário. O app fica nos bastidores; o rolê é fora da tela.</p>' +
      '<div class="numeros">' +
        '<div><strong>6</strong><span>pessoas fixas</span></div>' +
        '<div><strong>4</strong><span>encontros por ciclo</span></div>' +
        '<div><strong>1</strong><span>lugar e horário</span></div>' +
      '</div>' +
      '<div class="espaco"></div>' +
      '<a class="btn btn-lima btn-bloco pulsar" href="#/quiz" data-acao="comecarQuiz">Entrar numa roda ' + icone('seta', 20, 2.4) + '</a>' +
      '<p class="selo-seguranca">' + icone('escudo', 14) + ' Identidade verificada e encontros em locais públicos parceiros</p>'
    );
  }

  function telaQuiz() {
    var topo =
      '<div class="topo">' +
        '<button class="btn-icone" type="button" data-acao="quizVoltar" aria-label="Voltar">' + icone('voltar') + '</button>' +
        '<span style="font-family:var(--fonte-titulo);font-weight:700;font-size:14px">Quiz de ritmo</span>' +
        '<span class="contador" aria-label="Passo ' + (passoQuiz + 1) + ' de ' + TOTAL_PASSOS + '">' + (passoQuiz + 1) + '/' + TOTAL_PASSOS + '</span>' +
      '</div>' +
      '<div class="barra" aria-hidden="true"><span style="width:' + ((passoQuiz + 1) / TOTAL_PASSOS * 100) + '%"></span></div>';

    if (passoQuiz === 0) {
      return tela(topo +
        '<p class="sobretitulo">Começando</p>' +
        '<h1 class="titulo titulo-menor">Como você quer ser chamado?</h1>' +
        '<p class="texto-apoio">Só o primeiro nome. É assim que sua roda vai te conhecer.</p>' +
        '<div class="campo"><label for="nome">Primeiro nome</label>' +
        '<input id="nome" name="nome" type="text" autocomplete="given-name" maxlength="30" value="' + esc(estado.nome) + '" placeholder="Ex.: Lara"></div>' +
        '<div class="espaco"></div>' +
        '<button id="quiz-continuar" class="btn btn-lima btn-bloco" type="button" data-acao="quizProximo"' + (estado.nome.trim() ? '' : ' disabled') + '>Continuar ' + icone('seta', 20, 2.4) + '</button>' +
        '<p class="nota">Leva cerca de 5 minutos. Dá para mudar tudo depois no perfil.</p>'
      );
    }

    var p = PERGUNTAS[passoQuiz - 1];
    var selecionadas = resposta(p.id);
    var ultima = passoQuiz === TOTAL_PASSOS - 1;
    var opcoes = p.opcoes.map(function (o) {
      var marcada = selecionadas.indexOf(o[0]) !== -1;
      return '<button class="opcao" type="button" data-acao="quizOpcao" data-id="' + o[0] + '" aria-pressed="' + marcada + '">' +
        '<span class="opcao-texto"><strong>' + o[1] + '</strong>' + (o[2] ? '<small>' + o[2] + '</small>' : '') + '</span>' +
        '<span class="marcador">' + icone('check', 14, 3.2) + '</span></button>';
    }).join('');

    return tela(topo +
      '<p class="sobretitulo">Pergunta ' + passoQuiz + ' de ' + PERGUNTAS.length + ': ' + p.tema.toLowerCase() + '</p>' +
      '<h1 class="titulo titulo-menor">' + p.pergunta + '</h1>' +
      '<p class="texto-apoio">' + p.dica + '</p>' +
      '<div class="opcoes" role="group" aria-label="' + p.pergunta + '">' + opcoes + '</div>' +
      '<div class="espaco"></div>' +
      '<button class="btn btn-lima btn-bloco" type="button" data-acao="quizProximo"' + (selecionadas.length ? '' : ' disabled') + '>' +
        (ultima ? 'Formar minha roda' : 'Continuar') + ' ' + icone('seta', 20, 2.4) + '</button>'
    );
  }

  function telaRoda() {
    var info = infoRoda();
    var meuInteresse = rotulo('interesses', resposta('interesses')[0]) || 'Novas amizades';
    var pessoas =
      '<div class="pessoa pessoa-voce"><span class="avatar avatar-voce avatar-pequeno">' + esc(primeiroNome().charAt(0).toUpperCase()) + '</span>' +
      '<span class="pessoa-texto"><strong>' + esc(primeiroNome()) + '</strong><small>Você, ' + meuInteresse.toLowerCase() + '</small></span></div>' +
      OUTROS.map(function (o) {
        return '<div class="pessoa"><span class="avatar avatar-outro avatar-pequeno">' + o[0].charAt(0) + '</span>' +
          '<span class="pessoa-texto"><strong>' + o[0] + '</strong><small>' + o[1] + '</small></span></div>';
      }).join('');

    return tela(
      '<div class="topo">' + btnVoltar('#/inicio', 'Ir para o início') +
        '<span class="etiqueta etiqueta-lima" style="box-shadow:0 0 14px rgba(200,255,62,.3)">Roda formada</span></div>' +
      '<h1 class="titulo">Conheça sua roda</h1>' +
      '<p class="texto-apoio">Seis pessoas com afinidade e a mesma agenda. O primeiro encontro é o primeiro olá.</p>' +
      '<div class="meta-roda">' +
        '<div><span style="color:var(--lima)">' + icone('calendario', 18) + '</span><strong>' + info.horario.nome + '</strong><span>4 semanas</span></div>' +
        '<div><span style="color:var(--lima)">' + icone('relogio', 18) + '</span><strong>' + info.horario.hora + '</strong><span>cerca de 2h30</span></div>' +
        '<div><span style="color:var(--lima)">' + icone('pino', 18) + '</span><strong>' + info.bairro + '</strong><span>' + info.local.toLowerCase() + '</span></div>' +
      '</div>' +
      '<div class="cabecalho-lista"><h2>Integrantes</h2><span>6 de 6</span></div>' +
      '<div class="integrantes">' + pessoas + '</div>' +
      '<div class="card card-tracejado"><div class="linha-info"><span style="color:var(--lima)">' + icone('estrela') + '</span>' +
        '<span><strong style="display:block;color:var(--texto);font-size:14px;margin-bottom:3px">Por que esta combinação</strong>Mesma disponibilidade, bairros próximos e profissões diferentes, para fugir da bolha. Sem fotos até o primeiro encontro.</span></div></div>' +
      '<div class="espaco"></div>' +
      '<a class="btn btn-lima btn-bloco" href="#/agenda">Ver agenda do ciclo ' + icone('seta', 20, 2.4) + '</a>' +
      '<a class="btn btn-texto btn-bloco" href="#/inicio" style="margin-top:6px">Explorar salas</a>'
    );
  }

  function telaAgenda() {
    var p = estado.presencas;
    var info = infoRoda();
    var titulos = ['Seu ciclo começa em breve', 'Um encontro feito', 'Metade do caminho', 'Falta só o último', 'Ciclo completo'];
    var textos = [
      'Cada presença acende uma parte do anel.',
      'Cada presença acende uma parte do anel.',
      'Repetição é o que transforma conhecidos em amigos.',
      'Na semana 4, o grupo planeja o próprio rolê.',
      'Hora da revelação: com quem você quer manter contato?'
    ];
    var lista = info.encontros.map(function (e, i) {
      var feito = i < p, proximo = i === p;
      var num = feito
        ? '<span class="num num-feito">' + icone('check', 16, 3.2) + '</span>'
        : '<span class="num' + (proximo ? ' num-proximo' : '') + '">' + (i + 1) + '</span>';
      var etiqueta = feito
        ? '<span class="etiqueta etiqueta-feito">Feito</span>'
        : proximo ? '<span class="etiqueta etiqueta-rosa">Próximo</span>' : '<span class="etiqueta">Agendado</span>';
      return '<li>' + num + '<span class="encontro-texto"><strong>Semana ' + (i + 1) + ': ' + e.tema + '</strong><small>' + e.data + '</small></span>' + etiqueta + '</li>';
    }).join('');

    var mapa =
      '<svg class="mapa" viewBox="0 0 92 92" aria-hidden="true"><rect width="92" height="92" fill="#0f140d"/>' +
      '<rect x="54" y="8" width="30" height="26" rx="4" fill="#16240f"/>' +
      '<path d="M0 30 L92 22" stroke="#26311f" stroke-width="6"/><path d="M0 64 L92 58" stroke="#26311f" stroke-width="5"/>' +
      '<path d="M28 0 L36 92" stroke="#26311f" stroke-width="6"/><path d="M66 40 L72 92" stroke="#26311f" stroke-width="4"/>' +
      '<circle cx="49" cy="44" r="14" fill="#c8ff3e" opacity="0.14"/>' +
      '<path d="M49 52 s-8-7-8-13 a8 8 0 0 1 16 0 c0 6-8 13-8 13z" fill="#c8ff3e"/><circle cx="49" cy="39" r="3" fill="#0a0d09"/></svg>';

    var acao = p < 4
      ? '<a class="btn btn-lima btn-bloco" href="#/ritual">Abrir ritual do dia ' + icone('seta', 20, 2.4) + '</a>'
      : '<a class="btn btn-rosa btn-bloco" href="#/revelacao">Ver revelação ' + icone('seta', 20, 2.4) + '</a>';

    return tela(
      '<div class="topo"><div><p class="sobretitulo" style="margin:0">Ciclo atual</p>' +
        '<h1 class="titulo" style="margin-top:4px;font-size:21px">Agenda do ciclo</h1></div>' +
        '<a class="btn-icone" href="#/roda" aria-label="Ver integrantes da roda">' + icone('pessoas') + '</a></div>' +
      '<div class="painel-anel"><div class="anel">' + anel(p) +
        '<div class="anel-centro"><strong>' + p + '<span>/4</span></strong><small>presenças</small></div></div>' +
        '<div class="painel-anel-texto"><strong>' + titulos[p] + '</strong><span>' + textos[p] + '</span></div></div>' +
      '<div class="card local">' + mapa + '<div class="local-texto"><small>Local parceiro</small>' +
        '<strong>' + info.local + ', ' + info.bairro + '</strong><span>Mesma mesa, ' + info.horario.nome.toLowerCase() + ' às ' + info.horario.hora + '</span></div></div>' +
      '<ul class="encontros">' + lista + '</ul>' +
      '<div class="espaco"></div>' + acao + navApp('agenda')
    );
  }

  function telaRitual() {
    var p = estado.presencas;
    if (p >= 4) {
      ir('#/revelacao');
      return '';
    }
    var cartas = CARTAS[p];
    var i = Math.min(estado.carta, cartas.length - 1);
    var c = cartas[i];
    var ultima = i === cartas.length - 1;
    var pontos = cartas.map(function (_, k) { return '<span' + (k === i ? ' class="ativo"' : '') + '></span>'; }).join('');

    return tela(
      '<div class="topo">' + btnVoltar('#/agenda', 'Voltar para a agenda') +
        '<span class="presenca"><span class="ponto"></span>Encontro ' + (p + 1) + ' de 4</span></div>' +
      '<p class="sobretitulo">Ritual do dia</p>' +
      '<h1 class="titulo">' + TEMAS[p] + '</h1>' +
      '<p class="texto-apoio">Abram as cartas juntos, uma de cada vez. Sem pressão de seguir à risca.</p>' +
      '<article class="carta" aria-live="polite">' +
        '<div class="carta-topo"><span>Carta ' + (i + 1) + ' de ' + cartas.length + '</span><img class="logo-neon" src="' + LOGO + '" alt=""></div>' +
        '<span class="carta-chamada">' + c[0] + '</span>' +
        '<p class="carta-texto">' + c[1] + '</p>' +
        '<div class="carta-rodape">' + icone('relogio', 16) + '<span>' + c[2] + '</span></div>' +
      '</article>' +
      '<div class="pontos" aria-hidden="true">' + pontos + '</div>' +
      '<div class="espaco"></div>' +
      '<div class="acoes">' +
        '<button class="btn btn-contorno" type="button" data-acao="cartaAnterior"' + (i === 0 ? ' disabled' : '') + '>Anterior</button>' +
        (ultima
          ? '<button class="btn btn-rosa" type="button" data-acao="concluirEncontro">Concluir encontro</button>'
          : '<button class="btn btn-lima" type="button" data-acao="cartaProxima">Próxima carta ' + icone('seta', 20, 2.4) + '</button>') +
      '</div>' +
      '<p class="nota">Ao concluir, sua presença é registrada e acende uma parte do anel.</p>'
    );
  }

  function telaRevelacao() {
    var p = estado.presencas;
    var topo = '<div class="topo">' + btnVoltar('#/agenda', 'Voltar para a agenda') +
      '<span class="etiqueta" style="border-color:rgba(255,79,203,.55);color:var(--rosa);padding:7px 12px">' + icone('cadeado', 14) + ' Escolha secreta</span></div>';

    if (p < 4) {
      var faltam = 4 - p;
      return tela(topo +
        '<p class="sobretitulo">Revelação</p>' +
        '<h1 class="titulo">A revelação abre no fim do ciclo</h1>' +
        '<p class="texto-apoio">' + (faltam === 1 ? 'Falta 1 encontro.' : 'Faltam ' + faltam + ' encontros.') +
        ' Depois do 4º, você escolhe em segredo com quem quer manter contato.</p>' +
        '<div class="painel-anel" style="justify-content:center"><div class="anel">' + anel(p) +
        '<div class="anel-centro"><strong>' + p + '<span>/4</span></strong><small>presenças</small></div></div></div>' +
        '<div class="espaco"></div>' +
        '<a class="btn btn-lima btn-bloco" href="#/agenda">Ver agenda do ciclo</a>' + navApp('agenda')
      );
    }

    if (!estado.revelado) {
      var lista = OUTROS.map(function (o) {
        var marcada = estado.escolhas.indexOf(o[0]) !== -1;
        return '<button class="escolha" type="button" data-acao="escolher" data-nome="' + o[0] + '" aria-pressed="' + marcada + '">' +
          '<span class="avatar avatar-pequeno">' + o[0].charAt(0) + '</span>' +
          '<span class="pessoa-texto" style="flex-grow:1"><strong>' + o[0] + '</strong><small>' + o[1] + '</small></span>' +
          '<span class="coracao">' + svg(ICONE.coracao, 14, 2.2) + '</span></button>';
      }).join('');
      var n = estado.escolhas.length;
      return tela(topo +
        '<p class="sobretitulo">Fim do ciclo</p>' +
        '<h1 class="titulo titulo-menor">Com quem você quer manter contato?</h1>' +
        '<p class="texto-apoio">Ninguém vê sua escolha. Só revelamos quando o interesse é mútuo.</p>' +
        '<div class="opcoes" role="group" aria-label="Pessoas da sua roda">' + lista + '</div>' +
        '<div class="espaco"></div>' +
        '<p class="nota" style="margin:0 0 12px">' + (n === 0 ? 'Selecione uma ou mais pessoas' : n === 1 ? '1 pessoa selecionada' : n + ' pessoas selecionadas') + '</p>' +
        '<button class="btn btn-rosa btn-bloco" type="button" data-acao="revelar"' + (n ? '' : ' disabled') + '>Revelar matches</button>'
      );
    }

    var matches = OUTROS.filter(function (o) {
      return estado.escolhas.indexOf(o[0]) !== -1 && ESCOLHERAM_VOCE.indexOf(o[0]) !== -1;
    });
    var m = matches.length;
    var itens = m
      ? matches.map(function (o) {
          return '<li><span class="avatar avatar-pequeno">' + o[0].charAt(0) + '</span>' +
            '<span class="pessoa-texto" style="flex-grow:1"><strong>' + o[0] + '</strong><small style="color:var(--rosa-claro)">Match mútuo</small></span>' +
            '<button class="btn btn-texto btn-pequeno" type="button" data-acao="mandarOi" data-nome="' + o[0] + '" style="color:var(--lima)">Mandar oi</button></li>';
        }).join('')
      : '<li><span class="texto-apoio" style="margin:0">Desta vez o interesse não coincidiu. Uma nova roda é uma nova chance.</span></li>';

    return tela(topo +
      '<div class="revelado-logo"><img class="logo-neon" src="' + LOGO + '" alt=""></div>' +
      '<h1 class="titulo centro" style="margin-top:18px">' + (m ? 'Vocês se escolheram' : 'Ainda não foi desta vez') + '</h1>' +
      '<p class="texto-apoio centro">' + (m === 0 ? 'Suas escolhas continuam em segredo.' : m === 1 ? '1 match mútuo. A conversa já está liberada.' : m + ' matches mútuos. As conversas já estão liberadas.') + '</p>' +
      '<ul class="lista-matches">' + itens + '</ul>' +
      '<div class="espaco"></div>' +
      '<div class="card card-neon"><p class="sobretitulo" style="margin:0;color:var(--lima)">Próximo ciclo</p>' +
        '<strong style="display:block;margin-top:4px;font-family:var(--fonte-titulo);font-size:15px">Renovar como roda fechada</strong>' +
        '<span style="display:block;margin-top:4px;font-size:13px;color:var(--apoio)">Mesmo grupo, mais 4 encontros por R$ 79 o ciclo.</span>' +
        '<button class="btn btn-lima btn-bloco" type="button" data-acao="renovar" style="margin-top:14px;min-height:48px">Renovar a roda</button></div>' +
      '<button class="btn btn-texto btn-bloco" type="button" data-acao="refazerEscolha" style="margin-top:6px;color:var(--lima)">Refazer escolha</button>'
    );
  }

  function salasCalculadas() {
    var interesses = resposta('interesses');
    var hoje = new Date();
    return SALAS.map(function (s) {
      var data = proximoDia(s.dia, hoje);
      var reservada = estado.reservas.indexOf(s.id) !== -1;
      var naFila = estado.fila.indexOf(s.id) !== -1;
      var cheia = s.ocupadas >= 6;
      var ocupadas = Math.min(6, s.ocupadas + (reservada ? 1 : 0));
      var combina = interesses.indexOf(s.interesse) !== -1;
      return {
        s: s, data: data, quando: formatarData(data, s.hora), reservada: reservada, naFila: naFila,
        cheia: cheia, ocupadas: ocupadas, livres: 6 - ocupadas, combina: combina,
        motivo: combina ? 'Você curte ' + rotulo('interesses', s.interesse).toLowerCase() : 'Para sair da rotina'
      };
    }).sort(function (a, b) {
      if (a.combina !== b.combina) return a.combina ? -1 : 1;
      return a.data - b.data;
    });
  }

  function cartaoSala(x) {
    var pontos = '';
    for (var i = 0; i < 6; i++) {
      var cls = x.reservada && i === x.ocupadas - 1 ? 'sua' : i < x.ocupadas ? 'ocupada' : '';
      pontos += '<span' + (cls ? ' class="' + cls + '"' : '') + '></span>';
    }
    var legenda = x.reservada
      ? '<small class="sua">Seu lugar está garantido</small>'
      : x.cheia ? '<small>' + (x.naFila ? 'Você está na fila' : 'Sala cheia') + '</small>'
      : '<small>' + (x.livres === 1 ? 'Resta 1 lugar' : 'Restam ' + x.livres + ' lugares') + '</small>';
    var selo = !x.reservada && (x.cheia || x.livres === 1)
      ? '<span class="etiqueta etiqueta-rosa"><span class="ao-vivo"></span>' + (x.cheia ? 'Lotada' : 'Última vaga') + '</span>'
      : '';
    var botao;
    if (x.reservada) {
      botao = '<button class="btn btn-pequeno btn-reservado" type="button" data-acao="reservar" data-id="' + x.s.id + '" aria-label="Lugar reservado em ' + x.s.titulo + '. Toque para cancelar">' + icone('check', 14, 3) + ' Reservado</button>';
    } else if (x.cheia) {
      botao = '<button class="btn btn-pequeno btn-contorno" type="button" data-acao="fila" data-id="' + x.s.id + '">' + (x.naFila ? 'Sair da fila' : 'Entrar na fila') + '</button>';
    } else {
      botao = '<button class="btn btn-pequeno btn-lima" type="button" data-acao="reservar" data-id="' + x.s.id + '">Reservar lugar</button>';
    }
    return '<article class="sala' + (x.reservada ? ' sala-reservada' : '') + '">' +
      '<div class="sala-topo"><span class="sala-etiquetas"><span class="etiqueta etiqueta-lima">' + x.s.tipo + '</span>' + selo + '</span>' +
      '<span class="sala-motivo">' + x.motivo + '</span></div>' +
      '<h3>' + x.s.titulo + '</h3>' +
      '<span class="sala-info"><span style="color:var(--lima)">' + icone('relogio', 14) + '</span>' + x.quando + '</span>' +
      '<span class="sala-info"><span style="color:var(--lima)">' + icone('pino', 14) + '</span>' + x.s.local + '</span>' +
      '<div class="sala-rodape"><div class="vagas"><div class="vagas-pontos" aria-hidden="true">' + pontos + '</div>' + legenda + '</div>' + botao + '</div>' +
      '</article>';
  }

  function telaInicio() {
    var p = estado.presencas;
    var info = infoRoda();
    var todas = salasCalculadas();
    var filtro = estado.filtro;
    var visiveis = todas.filter(function (x) {
      if (filtro === 'todas') return true;
      if (filtro === 'pravoce') return x.combina;
      return x.s.cat === filtro;
    });
    var filtros = FILTROS.map(function (f) {
      return '<button class="filtro" type="button" data-acao="filtrar" data-id="' + f[0] + '" aria-pressed="' + (filtro === f[0]) + '">' + f[1] + '</button>';
    }).join('');
    var lista = visiveis.length
      ? visiveis.map(cartaoSala).join('')
      : '<div class="card card-tracejado"><p class="texto-apoio" style="margin:0">Nenhuma sala com esse filtro agora.</p>' +
        '<button class="btn btn-contorno btn-pequeno" type="button" data-acao="filtrar" data-id="todas" style="margin-top:12px">Ver todas as salas</button></div>';
    var n = estado.reservas.length;

    var cartaoRoda = p < 4
      ? '<a class="cartao-roda" href="#/agenda">' + miniAnel(p) +
        '<span class="cartao-roda-texto"><small>Sua roda: ' + p + ' de 4 encontros</small><strong>' + info.encontros[p].data + '</strong>' +
        '<span>Semana ' + (p + 1) + ': ' + TEMAS[p] + '</span></span>' + '<span style="color:var(--lima)">' + svg('<path d="M9 6l6 6-6 6"/>', 20, 2.2) + '</span></a>'
      : '<a class="cartao-roda" href="#/revelacao">' + miniAnel(4) +
        '<span class="cartao-roda-texto"><small>Ciclo completo</small><strong>Hora da revelação</strong><span>Escolha com quem quer manter contato</span></span></a>';

    return tela(
      '<div class="topo"><span class="marca"><img src="' + LOGO + '" alt=""><span>roda</span></span>' +
        '<a class="avatar avatar-voce" href="#/perfil" aria-label="Seu perfil">' + esc(primeiroNome().charAt(0).toUpperCase()) + '</a></div>' +
      '<h1 class="titulo">Oi, ' + esc(primeiroNome()) + '</h1>' +
      '<p class="texto-apoio">Rolês pensados a partir do que você curte.</p>' +
      cartaoRoda +
      '<div class="salas-cabecalho"><div><h2 id="salas">Salas para você</h2><p>Até 6 pessoas. Reserve seu lugar no espaço.</p></div>' +
        (n ? '<span class="contagem">' + (n === 1 ? '1 reserva' : n + ' reservas') + '</span>' : '') + '</div>' +
      '<div class="filtros" role="group" aria-label="Filtrar salas">' + filtros + '</div>' +
      '<div class="salas">' + lista + '</div>' +
      '<p class="nota" style="text-align:left">Ingresso e consumo são pagos direto no local. Encontros sempre em espaços públicos parceiros.</p>' +
      '<a class="cartao-cuidado" href="#/cuidado"><span class="cartao-cuidado-topo"><span>Roda Cuidado</span><span>R$ 59,90/mês</span></span>' +
        '<strong>Apoio para se conectar melhor</strong>' +
        '<span class="desc">Psicólogo, acompanhamento na plataforma e métodos para destravar a conversa.</span></a>' +
      '<div class="espaco"></div>' + navApp('inicio')
    );
  }

  var KITS = [
    ['pausa', 'Pausa', 'Para fases de ansiedade', 'Caderno de escrita guiada, chás de ervas, bolinha para apertar e cartas de respiração.'],
    ['foco', 'Foco', 'Para mente acelerada e TDAH', 'Bolinha sensorial para mãos inquietas, cartões de rotina, chás e camomila.'],
    ['conexao', 'Conexão', 'Para fases de desânimo e isolamento', 'Cartas "Vamos conversar?", dominó e dados para levar ao encontro e uma surpresa.'],
    ['descanso', 'Descanso', 'Para noites difíceis', 'Máscara de dormir, protetores auriculares e cartas para a hora de deitar.']
  ];

  function telaCuidado() {
    var beneficios = [
      ['conversa', 'Sessões com psicólogo', 'Atendimento online com psicólogos registrados no CRP.'],
      ['grafico', 'Acompanhamento na plataforma', 'Suas rodas, presenças e metas de conexão, revisadas com o profissional.'],
      ['balao', 'Métodos para se comunicar', 'Exercícios guiados, roteiros para puxar conversa e desafios para levar aos encontros.'],
      ['presente', 'Kit de cuidado todo mês', 'Uma esfera na sua porta com itens escolhidos para o seu momento, junto com o psicólogo.'],
      ['escudoMais', 'Encaminhamento médico, se indicado', 'Quando houver necessidade de medicação, a avaliação e a receita ficam com um psiquiatra.']
    ].map(function (b) {
      return '<li><span class="icone-quadro">' + icone(b[0]) + '</span><div><strong>' + b[1] + '</strong><span>' + b[2] + '</span></div></li>';
    }).join('');

    var kits = KITS.map(function (k) {
      return '<li class="kit"><img src="../assets/img/kit-' + k[0] + '.jpg" width="800" height="800" alt="Kit ' + k[1] + ' aberto" loading="lazy">' +
        '<div><strong>' + k[1] + '</strong><span class="kit-para">' + k[2] + '</span><span>' + esc(k[3]) + '</span></div></li>';
    }).join('');

    var acao = estado.assinante
      ? '<div class="ativo-caixa"><strong>' + icone('check', 18, 3) + ' Assinatura ativa</strong>' +
        '<span>O próximo passo é uma triagem rápida para escolher seu psicólogo.</span></div>' +
        '<button class="btn btn-texto btn-bloco" type="button" data-acao="cancelarAssinatura" style="margin-top:6px">Cancelar assinatura</button>'
      : '<button class="btn btn-rosa btn-bloco" type="button" data-acao="assinar">Assinar por R$ 59,90/mês</button>' +
        '<p class="nota">Versão de teste: o pagamento ainda não está integrado.</p>';

    return tela(
      '<div class="topo">' + btnVoltar('#/inicio', 'Voltar ao início') + '<img class="logo-neon" src="' + LOGO + '" width="40" height="40" alt="Roda"></div>' +
      '<p class="sobretitulo">Assinatura</p>' +
      '<h1 class="titulo titulo-grande">Roda Cuidado</h1>' +
      '<p class="texto-apoio">Apoio profissional para quem quer se conectar melhor. Funciona junto com as suas rodas e salas.</p>' +
      '<div class="preco"><div><small>Plano mensal</small><strong>R$ 59,90</strong></div><span>por mês</span></div>' +
      '<h2 class="secao-titulo" style="font-size:15px;margin-top:28px">O que está incluído</h2>' +
      '<ul class="beneficios">' + beneficios + '</ul>' +
      '<h2 class="secao-titulo" style="font-size:15px;margin-top:28px">Os kits do mês</h2>' +
      '<p class="texto-apoio" style="margin-top:4px">Deslize para conhecer. O kit é definido na triagem e pode mudar a cada mês.</p>' +
      '<ul class="kits" aria-label="Kits de cuidado">' + kits + '</ul>' +
      '<p class="nota" style="text-align:left">Os kits apoiam o acompanhamento e não substituem tratamento. Fitoterápicos só entram com indicação do profissional. Imagens ilustrativas.</p>' +
      '<div class="card card-tracejado"><div class="linha-info"><span style="color:var(--rosa)">' + icone('info') + '</span>' +
        '<span>A Roda Cuidado não é atendimento de emergência. Em um momento de crise, ligue 188 (CVV), gratuito e 24 horas.</span></div></div>' +
      '<div class="espaco"></div>' + acao + navApp('cuidado')
    );
  }

  function telaPerfil() {
    var interesses = resposta('interesses').map(function (id) {
      return '<span class="etiqueta etiqueta-lima">' + rotulo('interesses', id) + '</span>';
    }).join('') || '<span class="texto-apoio" style="margin:0">Nenhum interesse escolhido</span>';
    var info = infoRoda();
    var energia = rotulo('energia', resposta('energia')[0]);

    return tela(
      '<div class="topo">' + btnVoltar('#/inicio', 'Voltar ao início') + '<span></span></div>' +
      '<div class="perfil-cabecalho"><span class="avatar avatar-voce">' + esc(primeiroNome().charAt(0).toUpperCase()) + '</span>' +
        '<div><h1 class="titulo" style="margin:0">' + esc(primeiroNome()) + '</h1>' +
        '<p class="texto-apoio" style="margin-top:4px">' + info.bairro + (energia ? ', ' + energia.toLowerCase() : '') + '</p></div></div>' +
      '<h2 class="secao-titulo" style="font-size:15px">Seus interesses</h2><div class="chips">' + interesses + '</div>' +
      '<h2 class="secao-titulo" style="font-size:15px">Sua roda</h2>' +
      '<p class="texto-apoio">' + info.horario.nome + ' às ' + info.horario.hora + ', ' + info.local.toLowerCase() + ' em ' + info.bairro + '.</p>' +
      '<div class="card"><strong style="font-size:15px">Modo demonstração</strong>' +
        '<p class="texto-apoio" style="margin-top:4px;font-size:13px">Ajuste as presenças para mostrar cada etapa do ciclo no pitch.</p>' +
        '<div class="passo-demo"><span style="font-weight:700">Presenças</span><div>' +
          '<button class="btn-icone" type="button" data-acao="presencaMenos" aria-label="Diminuir presenças">' + icone('menos') + '</button>' +
          '<output aria-live="polite">' + estado.presencas + '</output>' +
          '<button class="btn-icone" type="button" data-acao="presencaMais" aria-label="Aumentar presenças">' + icone('mais') + '</button>' +
        '</div></div></div>' +
      '<div class="espaco"></div>' +
      '<button class="btn btn-contorno btn-bloco" type="button" data-acao="refazerQuiz">Refazer quiz de ritmo</button>' +
      '<button class="btn btn-texto btn-bloco" type="button" data-acao="apagarDados" style="margin-top:6px;color:var(--rosa-claro)">Apagar meus dados deste aparelho</button>' +
      navApp('perfil')
    );
  }

  /* ---------- Ações ---------- */

  var ACOES = {
    comecarQuiz: function () {
      passoQuiz = 0;
      ir('#/quiz');
    },
    quizVoltar: function () {
      if (passoQuiz > 0) {
        passoQuiz--;
        render();
      } else {
        ir(estado.onboarded ? '#/perfil' : '#/');
      }
    },
    quizOpcao: function (d) {
      var p = PERGUNTAS[passoQuiz - 1];
      var atuais = resposta(p.id);
      var novas;
      if (p.multi) {
        if (atuais.indexOf(d.id) !== -1) novas = atuais.filter(function (x) { return x !== d.id; });
        else if (atuais.length >= 3) novas = atuais.slice(1).concat(d.id);
        else novas = atuais.concat(d.id);
      } else {
        novas = [d.id];
      }
      var respostas = Object.assign({}, estado.respostas);
      respostas[p.id] = p.multi ? novas : novas[0];
      atualizar({ respostas: respostas });
    },
    quizProximo: function () {
      if (passoQuiz === 0 && !estado.nome.trim()) return;
      if (passoQuiz > 0 && !resposta(PERGUNTAS[passoQuiz - 1].id).length) return;
      if (passoQuiz < TOTAL_PASSOS - 1) {
        passoQuiz++;
        render();
        return;
      }
      var mudancas = { onboarded: true, filtro: 'pravoce' };
      if (!estado.onboarded) {
        mudancas.inicio = new Date().toISOString();
        mudancas.presencas = 0;
        mudancas.carta = 0;
        mudancas.escolhas = [];
        mudancas.revelado = false;
      }
      Object.assign(estado, mudancas);
      salvar();
      ir('#/roda');
    },
    cartaProxima: function () {
      atualizar({ carta: estado.carta + 1 });
    },
    cartaAnterior: function () {
      atualizar({ carta: Math.max(0, estado.carta - 1) });
    },
    concluirEncontro: function () {
      var p = Math.min(4, estado.presencas + 1);
      Object.assign(estado, { presencas: p, carta: 0 });
      salvar();
      avisar(p < 4 ? 'Presença registrada. ' + p + ' de 4 encontros.' : 'Ciclo completo! A revelação está aberta.');
      ir(p < 4 ? '#/agenda' : '#/revelacao');
    },
    escolher: function (d) {
      var e = estado.escolhas;
      atualizar({ escolhas: e.indexOf(d.nome) !== -1 ? e.filter(function (x) { return x !== d.nome; }) : e.concat(d.nome) });
    },
    revelar: function () {
      if (estado.escolhas.length) atualizar({ revelado: true });
    },
    refazerEscolha: function () {
      atualizar({ escolhas: [], revelado: false });
    },
    mandarOi: function (d) {
      avisar('Conversa com ' + d.nome + ' liberada. O chat chega na próxima versão.');
    },
    renovar: function () {
      Object.assign(estado, { inicio: new Date().toISOString(), presencas: 0, carta: 0, escolhas: [], revelado: false });
      salvar();
      avisar('Roda renovada para mais 4 encontros.');
      ir('#/inicio');
    },
    filtrar: function (d) {
      atualizar({ filtro: d.id });
    },
    reservar: function (d) {
      var sala = SALAS.filter(function (s) { return s.id === d.id; })[0];
      var r = estado.reservas;
      var tinha = r.indexOf(d.id) !== -1;
      atualizar({ reservas: tinha ? r.filter(function (x) { return x !== d.id; }) : r.concat(d.id) });
      avisar(tinha ? 'Reserva cancelada.' : 'Lugar reservado: ' + sala.titulo + '.');
    },
    fila: function (d) {
      var f = estado.fila;
      var tinha = f.indexOf(d.id) !== -1;
      atualizar({ fila: tinha ? f.filter(function (x) { return x !== d.id; }) : f.concat(d.id) });
      avisar(tinha ? 'Você saiu da fila.' : 'Você entrou na fila. Avisamos se abrir vaga.');
    },
    assinar: function () {
      atualizar({ assinante: true });
      avisar('Assinatura ativada.');
    },
    cancelarAssinatura: function () {
      atualizar({ assinante: false });
      avisar('Assinatura cancelada.');
    },
    presencaMais: function () {
      atualizar({ presencas: Math.min(4, estado.presencas + 1), carta: 0, revelado: false });
    },
    presencaMenos: function () {
      atualizar({ presencas: Math.max(0, estado.presencas - 1), carta: 0, revelado: false });
    },
    refazerQuiz: function () {
      passoQuiz = 0;
      ir('#/quiz');
    },
    apagarDados: function () {
      if (!window.confirm('Apagar seu nome, respostas e reservas deste aparelho?')) return;
      try { localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento */ }
      estado = estadoPadrao();
      passoQuiz = 0;
      ir('#/');
    }
  };

  document.addEventListener('click', function (evento) {
    var alvo = evento.target.closest('[data-acao]');
    if (!alvo || alvo.disabled) return;
    var acao = ACOES[alvo.getAttribute('data-acao')];
    if (!acao) return;
    evento.preventDefault();
    acao(alvo.dataset, alvo);
  });

  document.addEventListener('input', function (evento) {
    if (evento.target.id !== 'nome') return;
    estado.nome = evento.target.value.slice(0, 30);
    salvar();
    var botao = document.getElementById('quiz-continuar');
    if (botao) botao.disabled = !estado.nome.trim();
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.target.id === 'nome' && evento.key === 'Enter') {
      evento.preventDefault();
      ACOES.quizProximo();
    }
  });

  /* ---------- Roteador ---------- */

  var ROTAS = {
    '': { tela: telaBoasVindas, titulo: 'Boas-vindas', publica: true },
    quiz: { tela: telaQuiz, titulo: 'Quiz de ritmo', publica: true },
    roda: { tela: telaRoda, titulo: 'Sua roda' },
    inicio: { tela: telaInicio, titulo: 'Início' },
    agenda: { tela: telaAgenda, titulo: 'Agenda do ciclo' },
    ritual: { tela: telaRitual, titulo: 'Ritual do dia' },
    revelacao: { tela: telaRevelacao, titulo: 'Revelação' },
    cuidado: { tela: telaCuidado, titulo: 'Roda Cuidado' },
    perfil: { tela: telaPerfil, titulo: 'Perfil' }
  };

  function render() {
    var nome = location.hash.replace(/^#\/?/, '');
    var rota = ROTAS[nome];

    if (!rota) {
      ir(estado.onboarded ? '#/inicio' : '#/');
      return;
    }
    if (!rota.publica && !estado.onboarded) {
      ir('#/');
      return;
    }
    if (nome === '' && estado.onboarded) {
      ir('#/inicio');
      return;
    }

    var chave = nome === 'quiz' ? 'quiz-' + passoQuiz : nome;
    var mudouDeTela = chave !== ultimaRota;

    // Lembra qual controle estava em foco para devolvê-lo depois de atualizar a mesma tela
    var ativo = document.activeElement;
    var focoAnterior = ativo && ativo.getAttribute && ativo.getAttribute('data-acao')
      ? { acao: ativo.getAttribute('data-acao'), id: ativo.getAttribute('data-id') || ativo.getAttribute('data-nome') || '' }
      : null;

    var html = rota.tela();
    if (!html) return; // a tela redirecionou
    document.getElementById('app').innerHTML = html;
    document.title = 'Roda · ' + rota.titulo;

    if (mudouDeTela) {
      window.scrollTo(0, 0);
      var principal = document.getElementById('conteudo');
      var campo = document.getElementById('nome');
      if (campo && !campo.value) campo.focus();
      else if (principal && ultimaRota !== null) principal.focus({ preventScroll: true });
    } else if (focoAnterior) {
      var candidatos = document.querySelectorAll('[data-acao="' + focoAnterior.acao + '"]');
      for (var i = 0; i < candidatos.length; i++) {
        var c = candidatos[i];
        var id = c.getAttribute('data-id') || c.getAttribute('data-nome') || '';
        if (id === focoAnterior.id) {
          c.focus({ preventScroll: true });
          break;
        }
      }
    }
    ultimaRota = chave;
  }

  window.addEventListener('hashchange', render);
  render();
})();
