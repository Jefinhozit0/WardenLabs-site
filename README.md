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
  assets/css/site.css  ← estilos de todas as páginas
  assets/js/site.js    ← menu, rolagem guiada, perguntas e animações
  assets/js/brasa3d.js ← o Brasa em 3D (Three.js); sem WebGL, o Brasa em SVG aparece no lugar
  assets/vendor/       ← Three.js r160 (cópia local, porque o site só aceita scripts do próprio domínio)
  assets/img/favicon.svg
  assets/img/home/     ← Brasa e lanterna, recortados do vídeo do novo design
  assets/img/portal/   ← telas do sistema e logo, recortadas do vídeo de apresentação
  assets/img/landing/  ← screenshots da landing page da Abarth Automotiva
  assets/media/        ← vídeo de apresentação do Portal de Processos
```

## Atualizar o site

1. Edite os arquivos dentro de `public/`. Se mexer no CSS ou no JS, aumente o número em
   `site.css?v=10` / `site.js?v=9` nos quatro HTML (index, landing-pages, portal-de-processos e 404).
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
