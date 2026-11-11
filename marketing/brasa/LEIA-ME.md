# Brasa · kit para marketing

O Brasa é o robô guardião da Warden Labs: casco de titânio, visor escuro com olhos de luz âmbar e um núcleo de luz na mão. Estes arquivos saem do mesmo modelo 3D que roda no site,
então ele fica igual em todo lugar.

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `brasa.glb` | O modelo 3D. Use para criar poses novas, cenas e vídeos. |
| `brasa-frente.png` | De frente, fundo transparente (2000×2200). |
| `brasa-olhando-esquerda.png` | Olhando para a esquerda, fundo transparente. Bom ao lado de texto à esquerda. |
| `brasa-olhando-direita.png` | Olhando para a direita, fundo transparente. |
| `brasa-olhando-para-cima.png` | Olhando para cima, fundo transparente. Bom embaixo de um título. |
| `brasa-frente-fundo-escuro.png` | De frente, no fundo escuro do site (`#0d1013`). Pronto para post. |
| `brasa-avatar.png` | Rosto em quadrado (1024×1024). Foto de perfil e ícone. |

Os PNG transparentes encaixam em qualquer fundo: Canva, PowerPoint, Photoshop, Figma.

## Abrir e posar o modelo 3D (`brasa.glb`)

- **PowerPoint:** Inserir › Modelos 3D › Este dispositivo. Dá para girar com o mouse no próprio slide.
- **Windows:** dois cliques abre no Visualizador 3D.
- **Blender (grátis):** File › Import › glTF 2.0. As partes têm nome, então dá para mexer cada uma:
  - `Brasa` (o robô inteiro), `Corpo`, `Cabeca`, `Olhos`, `Olho_esquerdo`, `Olho_direito`
  - `Braco_da_luz`, `Nucleo_de_luz`, `Luz_do_nucleo`, `Braco_esquerdo`, `Arcos_holograficos`
  - Para ele olhar para um lado, gire `Cabeca` no eixo vertical. Para mudar a pose do braço, gire `Braco_da_luz`.
- **Na web:** arraste o arquivo em https://gltf-viewer.donmccurdy.com para ver rapidinho.

O brilho em volta dos olhos, do núcleo de luz e do propulsor é um efeito de tela do site e não vai no `.glb`.
No Blender, dá para recriar com um pouco de *Bloom* (Eevee): os olhos, as linhas de luz e o núcleo já são materiais que emitem luz.

## Cores da marca

- Âmbar da luz: `#f5b042` (claro: `#ffc566`, mais pálido: `#ffd98a`)
- Fundo noturno: `#0d1013` · Superfícies: `#151a1f` / `#1d242b` · Casco do Brasa: `#a7b3bd`
- Texto claro: `#eef2f4`

## Vídeos animados (`animacoes/`)

Quatro vídeos verticais (1080×1920, MP4, sem som) prontos para Reels, Stories e TikTok, em `animacoes/videos/`:

| Vídeo | O que mostra |
|---|---|
| `brasa-oi.mp4` | O Brasa acena e se apresenta. "Menos manual. Mais possível." |
| `brasa-lanterna.mp4` | Começa no escuro, o núcleo de luz acende. "A gente acende o caminho." |
| `brasa-apresenta.mp4` | Os três serviços: Sentinela, Guardião e Fortaleza. |
| `brasa-comemora.mp4` | Escopo, prazo e investimento combinados, e a guarda contínua. |

Para mudar um texto ou um movimento, edite `animacoes/estudio.js` (os textos ficam em `CLIPES`, no começo do arquivo).
Depois, dentro da pasta `animacoes`:

```
npm install        (só na primeira vez)
npm run previa     (abre o endereço que aparecer para ver no navegador)
npm run videos     (gera os MP4 de novo; leva uns 10 minutos)
```

Precisa do Chrome instalado. Os vídeos usam o mesmo modelo 3D do site.

## Gerar de novo ou em outra pose

O modelo é montado em código, em `public/assets/js/brasa3d.js` (função `buildBrasa`).
Se o Brasa mudar no site, gere o kit de novo dentro da pasta `animacoes`:

```
npm install        (só na primeira vez)
npm run kit        (refaz o brasa.glb e as 6 imagens; leva 1 minuto)
npm run videos     (refaz os 4 vídeos)
```

As poses e os enquadramentos das imagens ficam em `animacoes/kit.js` (a lista `FOTOS`).
