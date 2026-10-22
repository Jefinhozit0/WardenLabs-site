# Warden Labs · site

Site estático (HTML/CSS/JS puros) publicado no Cloudflare Pages:
**https://wardenlabs.pages.dev**

```
public/            ← tudo que vai para o ar
  index.html                     ← home da Warden Labs
  landing-pages/index.html       ← página do serviço de landing pages (plano Sentinela), com o exemplo da Abarth
  portal-de-processos/index.html ← página do produto Portal de Processos
  404.html
  robots.txt
  _headers         ← cabeçalhos de segurança e cache (lido pelo Cloudflare Pages)
  _redirects       ← /n1-portal antigo → /portal-de-processos/
  assets/css/styles.css
  assets/js/main.js
  assets/img/favicon.svg
  assets/img/portal/   ← telas do sistema e logo, recortadas do vídeo de apresentação
  assets/img/landing/  ← screenshots da landing page da Abarth Automotiva
  assets/media/        ← vídeo de apresentação do Portal de Processos
```

## Atualizar o site

1. Edite os arquivos dentro de `public/`. Se mexer no CSS ou no JS, aumente o número em
   `styles.css?v=7` / `main.js?v=7` nos quatro HTML (index, landing-pages, portal-de-processos e 404).
2. Em dash.cloudflare.com › Workers & Pages › **wardenlabs** › **Create deployment**,
   arraste a pasta `public` e clique em **Deploy**.

## Testar no notebook antes de publicar

Abra um terminal nesta pasta e rode:

```
npx serve public
```

## Domínio próprio (opcional)

Para usar `wardenlabs.com.br`: compre o domínio no registro.br e, no projeto do Pages,
vá em **Custom domains** › **Set up a custom domain**.
