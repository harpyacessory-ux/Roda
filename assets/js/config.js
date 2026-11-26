/* Roda — configuração do Firebase (contas com e-mail e senha)
 *
 * Cole aqui o bloco "firebaseConfig" do console do Firebase
 * (Configurações do projeto > Seus apps > Roda).
 * Esses códigos são públicos: só dizem qual projeto usar. Quem protege os dados
 * de cada pessoa são as regras do Firestore (arquivo firestore.rules).
 *
 * Com "firebase: {}" o app funciona sem contas, guardando tudo só no aparelho.
 */
window.RODA_CONFIG = {
  // Projeto "roda" (roda-d3e80), plano Spark (gratuito). O app não usa o Google Analytics.
  firebase: {
    apiKey: 'AIzaSyBw6upLNk4MD_WmQd_Hlrt7P2MfyM5_J8w',
    authDomain: 'roda-d3e80.firebaseapp.com',
    projectId: 'roda-d3e80',
    storageBucket: 'roda-d3e80.firebasestorage.app',
    messagingSenderId: '116280063948',
    appId: '1:116280063948:web:6d65467c890d4ef38f8f69'
  }
};
