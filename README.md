# KirkDon

RPG 2D satirico de captura de Persodons em pixel art estilo GBA.

## Como jogar

Abra `index.html` no navegador.

Controles:
- Setas ou WASD: mover.
- Segurar `Shift` ou `B`: correr com o Tenis de Corrida.
- Espaco ou Enter: interagir.
- Botao `TELA CHEIA`: abre o jogo em fullscreen.
- `I`: abrir mochila.
- `P`: abrir party.
- `M`: abrir menu de salvar/carregar.
- Batalha: `1` Fight, `2` Bag, `3` Party, `R` Run.
- Menus: setas, `Enter` para usar/confirmar/salvar, `L` para carregar save, `X` para voltar.

## Conteudo implementado

- Intro com nome customizavel.
- Nome vazio usa `Matheus Benevides`.
- Escolha de starter: Ovalid, Cowboil ou Paparazzit.
- Overworld com Votuporanga, Texas, Fronteira, Metro e Ilha Tein.
- Interior da Casa de Matheus com PC de caixas, healer de Persodon e porta de retorno para Votuporanga.
- Save/load local com ate 3 slots, acessivel pela tela inicial e pelo menu `M` dentro do jogo.
- Save mostra badges como contagem curta, por exemplo `5/7`.
- Loja da Matriz com itens de cura e Kirk Ball.
- Maquina de Cura no overworld para curar toda a party.
- 51 Persodons, incluindo Podcaster Iniciante, Estagiario de Votuporanga, Fa de Trap, Cousin Jarvis e o boss Algoritmo Fora de Controle.
- Evolucoes novas por item e nivel: Microfone de Condensador, Piadas Internas, Senior FullStacker, Membro da Recayd e Alexa Sarcastica.
- Clube dos Torcedores em Votuporanga, com lider que desafia o jogador se houver Persona Texano na party e entrega o Manto Sagrado.
- Ilha Tein com clima dinamico de glitch art e boss final que muda de tipo a cada turno.
- Encontros aleatorios.
- Batalha jogavel.
- Captura com Charlie Ball e Kirk Ball.
- 42 Persodons com sprites proprias em formato 64x64, agora com silhueta humanoide/chibi.
- Sprites de locais, sprites dos 7 ginasios e tileset de mapa.
- Sheets de revisao em `assets/sprites/persodons/persodon-sheet.png` e `assets/sprites/locations/location-sheet.png`.
- Mapas maiores que a tela, com camera seguindo o jogador.
- Zonas visiveis de encontro em grama alta, flashes, backlots e areas de endgame.
- Movimento top-down por grid 16x16, interacao frontal, Tenis de Corrida e obstaculos de campo via CORTA-CLIP, EMPURRA e TRAVESSIA.
- Treinadores/Subcelebridades com linha de visao, aviso `!`, aproximacao e batalha obrigatoria.
- Batalha 1v1 por turnos com 6 stats calculados por IV/EV/nature, 4 golpes, PP, poder, precisao, STAB, critico 6.25%, vantagens de tipo e status negativos.
- Captura por formula estilo Gen 3 com quatro verificacoes de shake.
- IA Wild/Standard com escolha uniforme e IA Elite/Lider priorizando super efetivo e Full Restore em HP baixo.
- Party de ate 6 Persodons, envio automatico ao PC quando a party esta cheia e PC com caixas de 30 slots acessivel em Centros de Cura.
- Mochila com bolsos de Items, Balls, Key Items e TM/HM.
- EXP, level up, aprendizado automatico de golpes e evolucoes por nivel ou item.
- Canvas renderizado em 1920x1080, com viewport 16:9 de 30x16 tiles.
- Sprites individuais de locations normalizados para 640x640.
- 7 Lideres de Ginasio.
- Evento mitico de Kanye West apos 7 badges.

## Arquivos principais

- `docs/charlie-kirk-mon-game-design.md`: GDD atualizado para KirkDon.
- `index.html`: entrada jogavel.
- `styles.css`: UI pixelada.
- `src/data.js`: dados de Persodons, regioes, ginasios e itens.
- `src/main.js`: loop de jogo, overworld, batalha e captura.
- `tools/generate-assets.ps1`: regenera sprites/tilesets.

## Regenerar assets

```powershell
powershell -ExecutionPolicy Bypass -File tools\generate-assets.ps1
```
