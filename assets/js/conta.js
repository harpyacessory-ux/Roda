/* Roda — contas com e-mail e senha
 * Login: Firebase Authentication (biblioteca compat, carregada antes deste arquivo).
 * Progresso de cada pessoa: Cloud Firestore, documento usuarios/{uid}, pela API REST
 * (evita baixar a biblioteca do Firestore, que é pesada para celular).
 *
 * Expõe window.RodaConta. Sem configuração, ou se o Firebase não carregar,
 * RodaConta.ativo fica false e o app segue funcionando só no aparelho.
 */
(function () {
  'use strict';

  var cfg = (window.RODA_CONFIG && window.RODA_CONFIG.firebase) || {};
  var ativo = !!(cfg.apiKey && cfg.projectId && window.firebase && window.firebase.auth);

  var Conta = {
    ativo: ativo,
    pronto: !ativo, // vira true quando o Firebase diz se há alguém logado
    usuario: null   // { uid, email } de quem está logado
  };
  window.RodaConta = Conta;
  if (!ativo) return;

  firebase.initializeApp(cfg);
  var auth = firebase.auth();
  auth.useDeviceLanguage(); // e-mails de senha em português para quem usa o celular em português

  var ouvintes = [];
  Conta.aoMudar = function (fn) { ouvintes.push(fn); };

  function avisarOuvintes() {
    ouvintes.forEach(function (fn) { fn(Conta.usuario); });
  }

  auth.onAuthStateChanged(function (u) {
    Conta.usuario = u ? { uid: u.uid, email: u.email } : null;
    Conta.pronto = true;
    avisarOuvintes();
  });

  // Com rede muito ruim, não deixa o app preso na tela de carregamento
  setTimeout(function () {
    if (Conta.pronto) return;
    Conta.pronto = true;
    avisarOuvintes();
  }, 6000);

  /* ---------- Login ---------- */

  Conta.criar = function (email, senha) {
    return auth.createUserWithEmailAndPassword(email, senha);
  };

  Conta.entrar = function (email, senha) {
    return auth.signInWithEmailAndPassword(email, senha);
  };

  Conta.recuperar = function (email) {
    var volta = { url: location.origin + location.pathname + '#/entrar' };
    return auth.sendPasswordResetEmail(email, volta).catch(function (erro) {
      // Endereço do app ainda não autorizado no Firebase: manda o e-mail sem o botão de voltar ao app
      if (erro && /continue-uri|unauthorized-domain/.test(erro.code || '')) return auth.sendPasswordResetEmail(email);
      throw erro;
    });
  };

  Conta.sair = function () {
    return auth.signOut();
  };

  // Pede a senha de novo (exigência do Firebase para excluir), apaga os dados e depois a conta
  Conta.excluir = function (senha) {
    var u = auth.currentUser;
    if (!u) return Promise.reject({ code: 'auth/no-current-user' });
    var credencial = firebase.auth.EmailAuthProvider.credential(u.email, senha);
    return u.reauthenticateWithCredential(credencial)
      .then(function () { return pedir('DELETE'); })
      .then(function () { return u.delete(); });
  };

  /* ---------- Dados no Firestore (REST) ---------- */

  var BASE = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(cfg.projectId) +
    '/databases/(default)/documents/usuarios/';

  function pedir(metodo, corpo, manterAberto) {
    var u = auth.currentUser;
    if (!u) return Promise.reject(new Error('sem-usuario'));
    return u.getIdToken().then(function (token) {
      return fetch(BASE + encodeURIComponent(u.uid), {
        method: metodo,
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: corpo ? JSON.stringify(corpo) : undefined,
        keepalive: !!manterAberto // deixa terminar de salvar mesmo se a pessoa fechar o app
      });
    }).then(function (r) {
      if (r.status === 404 && metodo === 'GET') return null; // ainda não tem dados salvos
      if (!r.ok) throw new Error('firestore-' + r.status);
      return metodo === 'GET' ? r.json() : null;
    });
  }

  function paraFirestore(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (Array.isArray(v)) return { arrayValue: v.length ? { values: v.map(paraFirestore) } : {} };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'object') {
      var campos = {};
      Object.keys(v).forEach(function (k) { campos[k] = paraFirestore(v[k]); });
      return { mapValue: Object.keys(campos).length ? { fields: campos } : {} };
    }
    return { nullValue: null };
  }

  function deFirestore(v) {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(deFirestore);
    if ('mapValue' in v) {
      var o = {};
      var f = v.mapValue.fields || {};
      Object.keys(f).forEach(function (k) { o[k] = deFirestore(f[k]); });
      return o;
    }
    return null;
  }

  Conta.lerDados = function () {
    return pedir('GET').then(function (doc) {
      return doc && doc.fields ? deFirestore({ mapValue: { fields: doc.fields } }) : null;
    });
  };

  Conta.salvarDados = function (dados, manterAberto) {
    return pedir('PATCH', { fields: paraFirestore(dados).mapValue.fields || {} }, manterAberto);
  };

  /* ---------- Mensagens de erro em português ---------- */

  var MENSAGENS = {
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Toque em "Entrar" logo abaixo.',
    'auth/invalid-email': 'Esse e-mail não parece certo. Confira e tente de novo.',
    'auth/missing-email': 'Digite seu e-mail.',
    'auth/weak-password': 'Essa senha é fraca. Use pelo menos 8 caracteres.',
    'auth/missing-password': 'Digite sua senha.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.',
    'auth/user-disabled': 'Essa conta foi desativada.',
    'auth/too-many-requests': 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com a internet. Confira e tente de novo.',
    'auth/requires-recent-login': 'Por segurança, digite sua senha de novo.',
    'auth/operation-not-allowed': 'O login por e-mail e senha ainda não foi ativado no Firebase.',
    'auth/no-current-user': 'Sua sessão expirou. Entre de novo.'
  };

  Conta.mensagem = function (erro) {
    var codigo = (erro && erro.code) || '';
    if (MENSAGENS[codigo]) return MENSAGENS[codigo];
    if (erro && /^firestore-/.test(erro.message || '')) return 'Não conseguimos acessar seus dados agora. Tente de novo em instantes.';
    return 'Não deu certo agora. Confira a internet e tente de novo.';
  };
})();
