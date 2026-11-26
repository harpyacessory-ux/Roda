# Roda

**Amizade não acontece por acaso. Acontece por repetição.**

A Roda forma grupos fixos de 6 desconhecidos que se encontram 4 vezes, sempre no mesmo lugar e horário. Entre um encontro e outro, o app sugere salas de até 6 pessoas, como futebol, cinema ou bar, com base no que cada pessoa curte.

Este repositório tem o site institucional e o protótipo funcional do app. São arquivos estáticos (HTML, CSS e JavaScript puro): não precisa instalar nada nem rodar build.

## Estrutura

```
Roda/
├── index.html          Site institucional (landing page)
├── privacidade.html    Política de privacidade (link no cadastro e no rodapé)
├── firestore.rules     Regras de segurança do banco (colar no console do Firebase)
├── robots.txt, sitemap.xml
├── app/
│   ├── index.html      App (abre em /app/)
│   ├── manifest.webmanifest, sw.js   Instalação no celular e modo sem internet
├── assets/
│   ├── css/
│   │   ├── base.css    Cores, fontes e botões compartilhados
│   │   ├── site.css    Estilos do site
│   │   └── app.css     Estilos do app
│   ├── js/
│   │   ├── config.js   Códigos do projeto no Firebase (vazio = sem contas)
│   │   ├── conta.js    Login com e-mail e senha e dados na conta
│   │   ├── tema.js     Tema claro e escuro
│   │   └── app.js      Telas, navegação e dados do app
│   └── img/            Logo (neon e original), favicon e ícone
├── .nojekyll
└── README.md
```

## Contas (e-mail e senha)

O login usa o **Firebase Authentication** e o progresso de cada pessoa fica no **Cloud Firestore**, no documento `usuarios/{uid}`. Com `firebase: {}` em `assets/js/config.js`, o app funciona sem contas, guardando tudo só no aparelho.

Para ligar:

1. No console do Firebase, crie o projeto e registre um app da Web. Copie o bloco `firebaseConfig` para `assets/js/config.js`.
2. **Authentication › Método de login:** ative **E-mail/senha**.
3. **Authentication › Configurações › Domínios autorizados:** adicione `roda-liart.vercel.app`.
4. **Authentication › Modelos:** idioma **Português (Brasil)**.
5. **Firestore Database:** crie o banco em `southamerica-east1` (São Paulo), modo de produção, e cole `firestore.rules` na aba **Regras**.

Fluxo: quiz → **criar conta** → sua roda. Quem já tem conta entra por **Já tenho conta**. No Perfil ficam **Sair da conta** e **Excluir minha conta**, que apaga a conta e os dados.

## Telas do app

| Rota | Tela |
| --- | --- |
| `#/` | Boas-vindas |
| `#/quiz` | Quiz de ritmo (nome + 5 perguntas) |
| `#/roda` | Sua roda: os 6 integrantes |
| `#/inicio` | Início com as salas sugeridas pelos seus interesses |
| `#/agenda` | Agenda do ciclo com o anel de presenças |
| `#/ritual` | Cartas do ritual de cada semana |
| `#/revelacao` | Escolha secreta e matches mútuos |
| `#/cuidado` | Assinatura Roda Cuidado (R$ 59,90/mês) |
| `#/perfil` | Perfil, modo demonstração e conta |
| `#/criar-conta` | Criar conta (e-mail, senha e aceite da política) |
| `#/entrar` | Entrar com e-mail e senha |
| `#/recuperar` | Esqueci minha senha (manda link por e-mail) |
| `#/excluir-conta` | Excluir a conta e todos os dados |

No **Perfil** existe um modo demonstração para ajustar as presenças (0 a 4) e mostrar cada etapa do ciclo durante o pitch.

## Rodar no computador

Abra a pasta num terminal e rode um servidor simples:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000` (site) e `http://localhost:8000/app/` (app).

## Publicar com GitHub Pages

1. Suba os arquivos para o repositório (veja abaixo).
2. No GitHub, vá em **Settings › Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. Clique em **Save**.
4. Em alguns minutos o site fica disponível em `https://harpyacessory-ux.github.io/Roda/` e o app em `https://harpyacessory-ux.github.io/Roda/app/`.

## Subir os arquivos

**Pelo navegador:** no repositório, clique em **uploading an existing file**, arraste todo o conteúdo desta pasta (não a pasta em si) e confirme em **Commit changes**.

**Pelo terminal**, dentro desta pasta:

```bash
git init
git add .
git commit -m "Site e app da Roda"
git branch -M main
git remote add origin https://github.com/harpyacessory-ux/Roda.git
git push -u origin main
```

## O que é protótipo

- Com o Firebase configurado, cada pessoa tem conta com e-mail e senha e o progresso fica salvo nela. Sem ele, os dados ficam só no navegador (`localStorage`).
- Os integrantes da roda, as salas, os locais e os matches da revelação são exemplos.
- A assinatura da Roda Cuidado não cobra de verdade: o pagamento ainda não está integrado.
- A Roda Cuidado não é atendimento de emergência. Em um momento de crise, ligue 188 (CVV), gratuito e 24 horas.

## Próximos passos sugeridos

- Verificação de identidade e formação real dos grupos.
- Integração de pagamento para o ciclo (R$ 79) e para a Roda Cuidado.
- Chat liberado após match mútuo.
- Cadastro de locais parceiros e das salas.
