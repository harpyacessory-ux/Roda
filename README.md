# Roda

**Amizade não acontece por acaso. Acontece por repetição.**

A Roda forma grupos fixos de 6 desconhecidos que se encontram 4 vezes, sempre no mesmo lugar e horário. Entre um encontro e outro, o app sugere salas de até 6 pessoas, como futebol, cinema ou bar, com base no que cada pessoa curte.

Este repositório tem o site institucional e o protótipo funcional do app. São arquivos estáticos (HTML, CSS e JavaScript puro): não precisa instalar nada nem rodar build.

## Estrutura

```
Roda/
├── index.html          Site institucional (landing page)
├── app/
│   └── index.html      App (abre em /app/)
├── assets/
│   ├── css/
│   │   ├── base.css    Cores, fontes e botões compartilhados
│   │   ├── site.css    Estilos do site
│   │   └── app.css     Estilos do app
│   ├── js/
│   │   └── app.js      Telas, navegação e dados do app
│   └── img/            Logo (neon e original), favicon e ícone
├── .nojekyll
└── README.md
```

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
| `#/perfil` | Perfil e modo demonstração |

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

- Os dados ficam só no navegador de cada pessoa (`localStorage`). Não há servidor, login nem banco de dados.
- Os integrantes da roda, as salas, os locais e os matches da revelação são exemplos.
- A assinatura da Roda Cuidado não cobra de verdade: o pagamento ainda não está integrado.
- A Roda Cuidado não é atendimento de emergência. Em um momento de crise, ligue 188 (CVV), gratuito e 24 horas.

## Próximos passos sugeridos

- Back-end com cadastro, verificação de identidade e formação real dos grupos.
- Integração de pagamento para o ciclo (R$ 79) e para a Roda Cuidado.
- Chat liberado após match mútuo.
- Cadastro de locais parceiros e das salas.
