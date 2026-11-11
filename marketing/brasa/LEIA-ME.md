# Brasa · kit para marketing

O Brasa é o guardião de pedra da Warden Labs. Estes arquivos saem do mesmo modelo 3D que roda no site,
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
  - `Braco_lanterna`, `Lanterna`, `Luz_da_lanterna`, `Braco_esquerdo`
  - Para ele olhar para um lado, gire `Cabeca` no eixo vertical. Para mudar a pose do braço, gire `Braco_lanterna`.
- **Na web:** arraste o arquivo em https://gltf-viewer.donmccurdy.com para ver rapidinho.

O brilho em volta dos olhos e da lanterna é um efeito de tela do site e não vai no `.glb`.
No Blender, dá para recriar com um pouco de *Bloom* (Eevee) ou com a emissão dos materiais dos olhos e do vidro.

## Cores da marca

- Âmbar da lanterna: `#f5b042` (claro: `#ffc566`, mais pálido: `#ffd98a`)
- Fundo noturno: `#0d1013` · Pedra: `#151a1f` / `#1d242b`
- Texto claro: `#eef2f4`

## Gerar de novo ou em outra pose

O modelo é montado em código, em `public/assets/js/brasa3d.js` (função `buildBrasa`).
Se mudar o Brasa no site, peça para gerar o kit de novo e os arquivos daqui acompanham.
