# KirkDon - Game Design Document

Versao: 0.1  
Escopo: design completo de pre-producao para um RPG 2D de captura de Personas em estilo GBA, inspirado na estrutura visual e de jogo de Pokemon FireRed/LeafGreen.  
Idioma base: PT-BR. Textos in-game podem misturar PT-BR com termos satiricos em ingles, desde que a UI continue curta e legivel.

Entregaveis nesta versao:
- Documento de design: `docs/charlie-kirk-mon-game-design.md`.
- Sprite conceitual fonte: `assets/concepts/matheus-benevides-sprite-concept-source.png`.
- Sprite conceitual normalizado 64x64: `assets/concepts/matheus-benevides-sprite-64-transparent.png`.
- Build jogavel: `index.html`.
- Persodon sprites: 42 sprites humanoides/chibi 64x64 em `assets/sprites/persodons/`.
- Zonas de encontro visiveis: grama alta, campos secos, flashes de estudio e areas de endgame.

Nome final do jogo: KirkDon.

## 1. Visao Geral

KirkDon e um RPG satirico de captura, batalha e colecao de "Persodons", criaturas-caricatura inspiradas em arquetipos da cultura pop, politica, midia e teorias sociais dos EUA. O jogador comeca em Votuporanga-SP, cruza uma versao compactada e absurda das Americas, enfrenta 7 Lideres de Ginasio e desmonta uma faccao chamada O Sindicato do Esquecimento.

O tom e parodico, nao documental. Personas publicas reais devem ser tratadas como caricaturas transformativas ou substituidas por equivalentes ficcionais quando houver risco de uso de imagem, difamacao ou conflito de licenca. A excecao de design pedida e o Persona Mitico Kanye West, que deve ser tratado como aparicao rara, estilizada, nao-realista e sem falas ou alegacoes factuais.

## 2. Pilares De Design

1. Estetica GBA rigorosa  
   O jogo renderiza internamente em 240x160, usa grid de 8px, tiles 16x16 para mapa, sprites pixelados sem anti-aliasing, janelas 9-patch, paletas limitadas e animacoes curtas de 30 ou 60 frames.

2. Satira legivel sem virar texto demais  
   A piada principal deve estar em nomes, silhuetas, ataques, lideres e eventos. Dialogos seguem limite curto de portatil: 2 linhas por caixa, frases com punchline rapida.

3. Captura classica, tema novo  
   Party de 6 Personas, armazenamento em PC, batalha por turnos, 4 golpes por Persona, evolucoes, raridade, status, itens de captura e badges.

4. Mapa como road trip absurda  
   Votuporanga e o tutorial emocional. Texas, Mexico/fronteira e EUA metropolitano expandem mecanicas. Ilha Tein fecha o jogo com dungeons, sindicato e Personas raras.

5. Dados antes de hardcode  
   Personas, golpes, itens, dialogos, encontros e mapas devem viver em arquivos de dados. A engine interpreta esses dados.

## 3. Stack Recomendado

Runtime:
- Phaser 3 + TypeScript + Vite.
- Tiled para mapas TMX/JSON.
- Aseprite para sprites, tilesets e animacoes.
- Howler ou audio nativo Phaser para SFX/musica.

Render:
- Canvas/WebGL Phaser, camera top-down com scroll por tile.
- Resolucao logica fixa de 240x160.
- Escala inteira: 2x, 3x, 4x ou 5x conforme viewport.
- `image-rendering: pixelated`.
- Sem filtros, blur, glow, sombra CSS ou interpolacao.

Arquitetura:
- `src/sim`: estado de jogo, batalha, captura, inventario, progresso e save.
- `src/render`: cenas Phaser, camera, animacoes, tilemaps e sprites.
- `src/ui`: janelas 9-patch, menus, dialogos e overlays.
- `src/data`: JSON/TS data para Personas, golpes, itens, mapas, encontros e NPCs.
- `src/content`: scripts de historia e eventos.

Save:
- Salvar apenas estado serializavel: jogador, party, boxes, flags, inventario, badges, mapa, posicao e seed.
- Nunca salvar objetos Phaser.

## 4. Direcao Visual

Base tecnica:
- Tela nativa: 240x160.
- Tile atomico: 8x8.
- Metatile/mapa: 16x16.
- Sprite overworld humano: 16x24 ou 16x32, encaixado em celula 16x32.
- Sprite Persona em batalha: 64x64.
- UI sempre em multiplos de 8.

Paleta principal:
- Vermelho principal: `#e03228`.
- Laranja de alerta: `#f87830`.
- Dourado: `#f8d030`.
- Parchment window fill: `#f0e8c8`.
- Texto: `#181818`.
- Borda escura: `#1a1a2e`.
- Borda media: `#707070`.
- Sombra: `#484848`.
- EXP: `#4890f8`.
- HP verde/amarelo/vermelho: `#40b840`, `#f8d030`, `#e03228`.

Regras:
- Sem gradientes.
- Sem anti-aliasing.
- Sem preto puro/branco puro exceto flashes.
- Maximo pratico de 4 cores por tile de 8x8.
- Texto bitmap 8px, estilo `Press Start 2P` como fallback web.
- Menus em uppercase. Dialogos podem usar caixa mista.

Janelas:
- Todas as janelas usam 9-patch com fill `#f0e8c8`.
- Borda 8px `#707070`, stroke externo `#1a1a2e`, highlight `#b8b8b8`, sombra 4px `#484848`.
- Dialogo padrao: 232x48, posicao inferior, 2 linhas.
- Action menu batalha: 120x48, grid 2x2.

## 5. Protagonista

Nome padrao:
- Matheus Benevides.

Resumo visual:
- Jovem treinador masculino.
- Cabelo preto curto.
- Oculos escuros/pretos com reflexo simples.
- Camiseta branca.
- Jeans azul.
- Tenis escuro.
- Silhueta casual e urbana, sem pose heroica exagerada.

Sprite conceitual pedido:
- Canvas: 64x64.
- Layout recomendado: 4 colunas x 2 linhas.
- Cada frame: 16x32.
- Linha 1: frente idle, frente passo A, frente passo B, lado idle.
- Linha 2: costas idle, costas passo A, costas passo B, lado passo.
- Fundo transparente no asset final de producao. Para conceito pode usar fundo plano removivel.

## 6. Introducao E Customizacao De Nome

Cena: Intro do Professor
- Personagem: Professora Ipe, pesquisadora de Personas de relevancia cultural.
- Tela 1: fade-in em laboratorio de 16x16 tiles, Persona starter saltando em uma mesa.
- Tela 2: explicacao curta do mundo.
- Tela 3: pergunta de nome.

Fluxo:
1. Exibe: "QUAL E O SEU NOME?"
2. Abre teclado GBA-style com letras, apagar, confirmar.
3. Se jogador confirma texto vazio ou somente espacos, usa "Matheus Benevides".
4. Se nome for longo, salva nome completo ate 24 caracteres, mas UI curta usa alias automatico.

Pseudocodigo:

```ts
const DEFAULT_PLAYER_NAME = "Matheus Benevides";
const MAX_FULL_NAME = 24;
const MAX_UI_NAME = 12;

export function resolvePlayerName(input: string) {
  const fullName = input.trim() || DEFAULT_PLAYER_NAME;
  return {
    fullName: fullName.slice(0, MAX_FULL_NAME),
    uiName: makeUiName(fullName),
  };
}

function makeUiName(name: string) {
  if (name.length <= MAX_UI_NAME) return name;
  const [first, ...rest] = name.split(" ");
  const lastInitial = rest.length ? ` ${rest[rest.length - 1][0]}.` : "";
  return `${first}${lastInitial}`.slice(0, MAX_UI_NAME);
}
```

Exemplo:
- Campo vazio: `fullName = "Matheus Benevides"`, `uiName = "Matheus B."`.
- Campo "Ana": `fullName = "Ana"`, `uiName = "Ana"`.

## 7. Verbos Principais Do Jogador

- Explorar rotas, cidades e dungeons.
- Conversar com NPCs satiricos.
- Encontrar Personas em grama alta, palcos, comicios, estudios, ranchos e bunkers.
- Batalhar por turnos.
- Capturar Personas com Balls tematicas.
- Treinar, evoluir e montar party de 6.
- Ganhar 7 badges.
- Frustrar planos do Sindicato do Esquecimento.
- Caçar o Persona Mitico Kanye West no endgame.

## 8. Sistema De Personas

Personas substituem Pokemon. Cada Persona tem:
- ID.
- Nome.
- Categoria.
- Tipos.
- Raridade.
- Evolucao.
- Stats base.
- Habilidade.
- Lista de golpes por nivel.
- Taxa de captura.
- Biomas de encontro.
- Flavor text curto.

Stats equivalentes:
- HP: Resiliencia.
- ATK: Impacto.
- DEF: Blindagem.
- SP.ATK: Retorica.
- SP.DEF: Contexto.
- SPD: Viralidade.

Tipos principais:
- Civico: Presidentes, eleicoes, burocracia.
- Midia: celebridades, cameras, tabloides.
- Culto: lideranca espiritual, devocao, hipnose social.
- Texano: cowboy, rancho, estrada, rodeio.
- Petroleo: plataformas, dinheiro fossil, maquinas.
- Neve: Alaska, frio, sobrevivencia.
- Fronteira: travessia, ponte, mercado, poeira.
- Conspiracao: simbolos, segredo, controle.
- Som: musica, palco, album, microfone.
- Mito: raridade lendaria, regras especiais.

Afinidades iniciais:
- Civico vence Conspiracao por "auditoria".
- Conspiracao vence Midia por "narrativa secreta".
- Midia vence Civico por "cobertura 24h".
- Texano vence Neve por "calor de asfalto".
- Neve vence Petroleo por "congelamento".
- Petroleo vence Texano por "financiamento".
- Culto resiste Civico e Midia.
- Som tem dano neutro alto e muitos efeitos.
- Mito ignora uma resistencia por batalha.

## 9. Lista Inicial De Personas

### Presidentes

1. Ovalid  
   Tipo: Civico  
   Raridade: comum  
   Evolui: Ovalid -> Resolutor  
   Conceito: pequeno broche oval que tenta discursar.

2. Resolutor  
   Tipo: Civico/Debate  
   Raridade: incomum  
   Conceito: podium ambulante com gravata e aura de campanha.

3. MountRushmo  
   Tipo: Civico/Rocha  
   Raridade: raro  
   Conceito: mini monumento com varias faces simplificadas e expressao imovel.

4. Filibustor  
   Tipo: Civico/Som  
   Raridade: incomum  
   Conceito: criatura que fala tanto que reduz a velocidade do alvo.

5. Vetozer  
   Tipo: Civico/Conspiracao  
   Raridade: raro  
   Conceito: carimbo vivo que bloqueia golpes de setup.

### Celebridades

6. Paparazzit  
   Tipo: Midia  
   Raridade: comum  
   Evolui: Paparazzit -> Flashique  
   Conceito: camera saltitante com oculos enormes.

7. Flashique  
   Tipo: Midia/Viral  
   Raridade: incomum  
   Conceito: tapete vermelho com flashes nas pontas.

8. Boxofficon  
   Tipo: Midia/Impacto  
   Raridade: raro  
   Conceito: claquete de cinema com punhos.

9. Popstarlet  
   Tipo: Midia/Som  
   Raridade: incomum  
   Conceito: microfone com jaqueta brilhante.

10. Trendiva  
   Tipo: Midia/Conspiracao  
   Raridade: raro  
   Conceito: diva de trend que muda de paleta a cada status.

### Cultos Ou Religiosos

11. Pamphletor  
   Tipo: Culto  
   Raridade: comum  
   Evolui: Pamphletor -> Megaphrophet -> Compoundra  
   Conceito: panfleto dobrado com olhos fervorosos.

12. Megaphrophet  
   Tipo: Culto/Som  
   Raridade: incomum  
   Conceito: megafone com capa cerimonial.

13. Compoundra  
   Tipo: Culto/Conspiracao  
   Raridade: raro  
   Conceito: pequeno complexo murado com torre de alto-falante.

14. Televangelux  
   Tipo: Culto/Midia  
   Raridade: raro  
   Conceito: TV antiga com aureola de neon.

### Texanos

15. Cowboil  
   Tipo: Texano/Petroleo  
   Raridade: comum  
   Evolui: Cowboil -> Drillhorn  
   Conceito: chapeu cowboy pingando oleo pixelado.

16. Drillhorn  
   Tipo: Petroleo/Terra  
   Raridade: incomum  
   Conceito: torre de perfuracao em forma de criatura de rancho.

17. Rodeon  
   Tipo: Texano/Impacto  
   Raridade: incomum  
   Conceito: sela animada que gira como ataque.

18. LoneStario  
   Tipo: Texano/Civico  
   Raridade: raro  
   Conceito: estrela de xerife com botas e postura orgulhosa.

### Alaskanos

19. Parkaprep  
   Tipo: Neve  
   Raridade: comum  
   Evolui: Parkaprep -> Frostprepper  
   Conceito: casaco de sobrevivencia com mochila gigante.

20. Frostprepper  
   Tipo: Neve/Fronteira  
   Raridade: incomum  
   Conceito: sobrevivencialista de gelo, lanterna e mapa.

21. Auroraudit  
   Tipo: Neve/Civico  
   Raridade: raro  
   Conceito: aurora boreal em forma de carimbo.

22. Snowblindr  
   Tipo: Neve/Conspiracao  
   Raridade: raro  
   Conceito: oculos de neve que confundem alvos.

### Illuminatianos

23. Pyramidion  
   Tipo: Conspiracao  
   Raridade: comum  
   Evolui: Pyramidion -> HandshakeX -> Globallure  
   Conceito: piramide pequena com olho abstrato, sem simbolos reais copiados.

24. HandshakeX  
   Tipo: Conspiracao/Civico  
   Raridade: incomum  
   Conceito: luvas flutuantes fazendo acordo secreto.

25. Globallure  
   Tipo: Conspiracao/Midia  
   Raridade: raro  
   Conceito: globo de controle remoto com antenas.

26. Backroomini  
   Tipo: Conspiracao/Culto  
   Raridade: raro  
   Conceito: porta de sala secreta que invoca boatos.

### Mitico

27. Stanlet  
   Tipo: Midia/Som  
   Raridade: raro  
   Evolui: Stanlet -> Hypebeato -> Kanye West  
   Conceito: fã iniciante com fone grande e camiseta de tour.

28. Hypebeato  
   Tipo: Som/Midia  
   Raridade: muito raro  
   Conceito: produtor de batida com tenis exagerado e aura dourada.

29. Kanye West  
   Tipo: Mito/Som  
   Raridade: mitico unico  
   Conceito: Persona lendario com paleta dourado/preto, silhueta superior, animacao propria e entrada com tela branca de 1 frame. Deve parecer uma caricatura mitica de palco, nao uma copia realista.

Kanye West deve ter:
- Maior soma de stats base do jogo.
- Taxa de captura muito baixa.
- Encontro unico na Ilha Tein apos 7 badges.
- Tema musical proprio.
- Golpe assinatura: ALBUM DROP.
- Habilidade: AURA DE ERA, que muda o tipo secundario do primeiro golpe usado em batalha.

## 10. Starters

Escolha inicial na casa da Professora Ipe:

1. Ovalid  
   Tipo: Civico  
   Forte em controle, defesa e dialogo.

2. Cowboil  
   Tipo: Texano/Petroleo  
   Forte em dano fisico, mas lento.

3. Paparazzit  
   Tipo: Midia  
   Rapido, bom em criticos e status.

O rival pega o starter com vantagem ciclica:
- Midia pressiona Civico.
- Civico regula Petroleo.
- Petroleo financia Midia.

## 11. Golpes

Exemplos de golpes:

| Golpe | Tipo | Poder | Precisao | PP | Efeito |
| --- | --- | ---: | ---: | ---: | --- |
| HOT TAKE | Midia | 40 | 100 | 25 | Chance de confundir |
| FACT CHECK | Civico | 50 | 95 | 20 | Remove bonus do alvo |
| FILIBUSTER | Civico/Som | 0 | 100 | 15 | Reduz Viralidade |
| OIL SPIKE | Petroleo | 65 | 90 | 15 | Chance de queimar |
| RODEO RUSH | Texano | 60 | 95 | 20 | Dano fisico |
| SNOW BLIND | Neve | 45 | 100 | 20 | Reduz precisao |
| SECRET HANDSHAKE | Conspiracao | 0 | 90 | 10 | Aumenta Retorica e Contexto |
| MEGA SERMON | Culto/Som | 70 | 85 | 10 | Chance de travar proximo golpe |
| RED CARPET | Midia | 0 | 100 | 15 | Aumenta evasao |
| ALBUM DROP | Mito/Som | 120 | 90 | 5 | Golpe assinatura de Kanye West |

Status renomeados:
- BRN: BURNED / queimado por exposicao.
- PAR: TRAVADO / preso em debate.
- SLP: OFFLINE / perde turnos.
- PSN: RUMOR / dano por turno.
- FRZ: CONGELADO / frio literal.
- CONFUSION: SPIN / chance de agir contra si.

## 12. Batalha

Formato:
- 1v1 por padrao.
- Party ate 6.
- 4 golpes por Persona.
- Troca consome turno salvo habilidades especificas.
- EXP por derrota/captura.
- Evolucao por nivel, item ou evento.

Tela:
- Enemy Persona 64x64 no topo direito.
- Player Persona 64x64 no inferior esquerdo.
- HUD inimigo 128x30 no topo esquerdo, sem HP numerico.
- HUD jogador 160x48 no inferior direito, com HP numerico e EXP.
- Action menu 2x2: FIGHT / BAG / PERSONA / RUN.

Ritmo:
- Texto de acao antes de animacao.
- Animacao 30-60 frames.
- HP drain em 30 frames.
- Mensagem de efetividade apos impacto.

## 13. Captura

Captura segue logica classica:
- HP baixo aumenta chance.
- Status aumenta chance.
- Cada Ball aplica multiplicador.
- Anima 1, 2 ou 3 tremidas.
- Sucesso gera registro na PersonaDex e prompt de apelido.

Itens de captura:

| Item | Base | Multiplicador | Uso |
| --- | --- | ---: | --- |
| Charlie Ball | Poke Ball | 1.0x | Captura normal |
| Kirk Ball | Great Ball | 1.5x | Captura melhorada |
| Burn Ball | Ultra Ball | 2.0x | Captura avancada |
| Mandate Ball | Master Ball | 255x/garantida | Unica, historia |
| Rally Ball | Safari Ball | 1.5x em zonas de evento | Usada em areas especiais |
| Echo Ball | Repeat Ball | 3.0x se Persona ja foi registrada | Re-captura |
| Countdown Ball | Timer Ball | escala por turno ate 4.0x | Lutas longas |
| Grassroots Ball | Nest Ball | forte contra nivel baixo | Early game |
| VIP Ball | Luxury Ball | 1.0x + amizade extra | Evolucoes por vinculo |
| Premiere Ball | Premier Ball | 1.0x cosmetica | Bonus por compra em lote |
| Border Ball | Net Ball | 3.0x contra Fronteira/Neve | Biomas de travessia |
| Deep Ball | Dive Ball | 3.5x em bunkers, estudio subterraneo e Ilha Tein | Dungeons |

Formula simplificada:

```ts
catchScore =
  ((3 * maxHp - 2 * currentHp) * catchRate * ballMultiplier * statusMultiplier)
  / (3 * maxHp);
```

## 14. Mundo E Progressao

Estrutura macro:
1. Votuporanga-SP: tutorial, 2 badges, primeiros sistemas.
2. Texas: arido, petroleo, rancho, primeira grande dungeon.
3. Mexico/Fronteira: travessia, mercado, rotas labirinticas, cultura de ponte.
4. EUA Metropolitano: midia, predios, estudios, politica nacional.
5. Ilha Tein: endgame, 2 badges finais, Sindicato e Persona Mitico.

### Votuporanga-SP

Referencias locais adaptadas:
- Parque da Cultura: hub cultural, biblioteca/cinema, shows, oficinas, area verde.
- Concha Acustica Prof. Geraldo Alves Machado: palco, eventos e primeiro grande combate publico.
- Praca da Matriz/Catedral: centro visual da cidade e ponto de encontro.
- Rua Amazonas: corredor comercial com lojas e tutorial de compra.
- Rodoviaria: acesso ao mapa expandido.
- Horto Florestal: primeira rota com grama alta mais densa.

Areas:
- Casa de Matheus: quarto tutorial, PC, opcao de save.
- Lab Ipe: escolha de starter.
- Praca Matriz: NPCs, tutorial de dialogo e primeiro rival.
- Concha Acustica: Ginasio 1.
- Parque da Cultura: Ginasio 2, sidequests de arte e midia.
- Horto Florestal: captura inicial e Pamphletor.
- Rodoviaria: transicao para road trip.

### Texas

Visual:
- Chao areia/ocre, asfalto rachado, placas grandes, torres de petroleo animadas em 2 frames.
- Grama alta vira capim seco.
- Dungeons: Refinaria Pixelada e Rancho do Eco.

Mecanicas novas:
- Terreno quente: alguns tiles causam dano leve sem bota termica.
- Golpes Petroleo e Texano aparecem mais.

### Mexico/Fronteira

Visual:
- Cores quentes, mercado de rua, pontes, muros baixos, desertos, neon em 16 cores controladas.
- Tratar a regiao como cultura de travessia e comercio, nao como estereotipo criminal.

Mecanicas novas:
- Rotas com portas de ida/volta.
- NPCs bilingues curtos.
- Border Ball introduzida.

### EUA Metropolitano

Visual:
- Predios altos simplificados, estudios de TV, metro, outdoors, calcadas cinza.
- Sem skyline realista complexo; tudo em blocos 16x16.

Mecanicas novas:
- Encontros em "zona de flashes" no lugar de grama alta.
- Subcelebridades do Sindicato aparecem em estudios.
- Golpes Midia e Civico dominam.

### Ilha Tein

Visual:
- Resort isolado, docas, bunker, palco abandonado, antenas, jardim artificial, sala de arquivos.
- Paleta: mar teal, concreto cinza, dourado gasto, vermelho de alarme.

Mecanicas novas:
- Dungeons com chaves, switches e elevadores.
- Deep Ball.
- Encontros raros Illuminatianos.
- Evento mitico para Kanye West apos 7 badges.

## 15. Ginasios

| # | Local | Lider | Tema | Badge | Persona-chave |
| --- | --- | --- | --- | --- | --- |
| 1 | Votuporanga, Concha Acustica | Maestro Playback | Midia/Som | Badge Palco | Paparazzit |
| 2 | Votuporanga, Parque da Cultura | Curadora Lina | Culto/Civico | Badge Cultura | Megaphrophet |
| 3 | Texas, Refinaria Pixelada | Tex Rex | Texano/Petroleo | Badge Oleo | Drillhorn |
| 4 | Mexico/Fronteira, Mercado Ponte | Marisol Puente | Fronteira/Neve | Badge Ponte | Frostprepper |
| 5 | EUA Metro, Studio 24h | Senador Neon | Civico/Midia | Badge Primetime | Filibustor |
| 6 | Ilha Tein, Arquivo Subterraneo | Arquivista Nulo | Conspiracao | Badge Sigilo | Globallure |
| 7 | Ilha Tein, Palco Eclipse | DJ Apoteose | Som/Mito | Badge Era | Hypebeato |

Cada Ginasio deve ter:
- Puzzle simples de 1 tela ou 2 salas.
- 3 a 5 treinadores.
- Lider com dialogo curto antes/depois.
- Badge, TM satirica e desbloqueio de campo.

Desbloqueios:
- Badge Palco: permite Cut equivalente, "CORTA-CLIP".
- Badge Cultura: permite Flash equivalente, "ILUMINA".
- Badge Oleo: permite Strength equivalente, "EMPURRA".
- Badge Ponte: permite Surf equivalente, "TRAVESSIA".
- Badge Primetime: permite Fly equivalente, "AO VIVO".
- Badge Sigilo: abre Ilha Tein profunda.
- Badge Era: libera evento mitico.

## 16. Faccao Antagonista

Nome: O Sindicato do Esquecimento.

Identidade:
- Subcelebridades, influenciadores irrelevantes e famosos que perderam relevancia cultural.
- Uniforme: blazer cinza, oculos escuros, cracha vencido, celular quebrado.
- Paleta: cinza `#707070`, roxo apagado `#705898`, vermelho `#e03228`.

Motivacao:
- Capturar Personas raras e arquivar toda relevancia cultural em uma maquina chamada MEMORIA ZERO.
- Eles nao querem dominar o mundo; querem impedir que qualquer coisa nova substitua sua nostalgia.

Hierarquia:
- Estagiario de Trend: grunt basico.
- Subcelebridade: inimigo comum.
- Ex-Famoso: mini-boss com Persona evoluida.
- Curador do Vazio: admin regional.
- Diretoria do Esquecimento: trio de admins finais.
- Chefe: Madame Reprise, ex-icone que vive de comeback infinito.

Eventos de historia:
1. Votuporanga: roubam um microfone da Concha Acustica.
2. Texas: tentam perfurar uma fonte de Personas Petroleo.
3. Fronteira: falsificam Border Balls.
4. Metro: sequestram transmissao de TV.
5. Ilha Tein: ativam MEMORIA ZERO.

## 17. UI E Menus

Menus principais:
- PERSONAS.
- BAG.
- DEX.
- SAVE.
- OPTION.
- EXIT.

Bag:
- ITEMS.
- KEY ITEMS.
- BALLS.
- TM/HM.

PersonaDex:
- ID.
- Nome.
- Categoria.
- Tipo.
- Sprite 64x64.
- Area vista/capturada.
- Flavor text de 2 linhas.

Naming:
- "Pokemon" vira "PERSONA".
- "Pokedex" vira "PERSONADEX".
- "Pokeball" vira "BALL".
- "Trainer" vira "TREINADOR" ou "CATCHER".

HUD:
- Nome do jogador pode truncar para alias.
- Dinheiro usa `C$` ou `CK$`, nunca simbolo real de moeda para evitar leitura politica literal.

## 18. Audio

Direcao:
- Chiptune GBA, 4 a 6 canais sintetizados.
- Bateria curta e seca.
- Baixo simples.
- Leads quadrados.

Temas:
- Votuporanga: melodia leve, interior paulista, andamento medio.
- Texas: swing seco, baixo marcado.
- Fronteira: percussao quente, melodia curta.
- Metro: arpejo rapido e snares.
- Ilha Tein: pads sombrios em chiptune, sem terror realista.
- Kanye West: tema mitico com beat minimalista e entrada de palco.

SFX:
- Ball throw, hit, menu cursor, badge, level up, capture success, evolution.

## 19. Asset Pipeline

Tiles:
- Tileset por bioma, 16x16 metatiles.
- Cada mapa usa paleta limitada e objetos foreground separados.
- Colisao definida em Tiled.

Sprites:
- Overworld humano: sheet 16x32 por frame.
- Personas batalha: 64x64 front/back.
- Icones party: 16x16.
- Ball icons: 16x16.
- UI 9-patch: 16x16 corners/edges/fill.

Naming:
- `assets/sprites/player/matheus-overworld.png`
- `assets/sprites/personas/027-stanlet-front.png`
- `assets/tilesets/votuporanga-town.png`
- `assets/ui/window-9patch.png`
- `assets/audio/bgm/votuporanga-theme.ogg`

Quality gates:
- Tudo encaixa no grid de 8px.
- Sem anti-aliasing.
- Silhueta legivel em escala 1x.
- Nenhum texto em sprite pequeno, exceto logos/placas grandes.

## 20. Prompt Do Sprite Conceitual

Use case: stylized-concept  
Asset type: game asset concept sprite sheet  
Input image role: attached photo is a visual reference for the protagonist only, especially short black hair, glasses, white t-shirt, casual build, friendly expression. Do not create a photorealistic likeness.  
Primary request: A single character sprite sheet, 64x64 pixels, 32-bit pixel art, GBA-era monster-catching RPG style. Male trainer with casual attire, jeans and white t-shirt, standing and walking poses.  
Composition: 64x64 canvas, 4 columns x 2 rows, each slot 16x32, full body, orthographic top-down RPG overworld proportions.  
Style/medium: crisp pixel art, hard square pixels, limited GBA-like palette, no anti-aliasing, no gradients, no blur.  
Color palette: white t-shirt, blue jeans, dark shoes, black hair, dark glasses, skin tones limited to 3 shades, outlines in dark indigo-charcoal rather than pure black.  
Constraints: transparent or flat removable single-color background, no scenery, no labels, no watermark, no text, no existing Pokemon trainer costume, no copied official sprites.  

## 21. Vertical Slice

Conteudo minimo para provar o jogo:
- Intro com Professora Ipe.
- Nome customizavel com fallback para Matheus Benevides.
- Escolha de starter.
- Votuporanga com 4 mapas: casa, laboratorio, Praca/centro, Concha Acustica.
- 10 Personas jogaveis.
- 1 Ginasio completo.
- 1 evento do Sindicato.
- 6 Balls.
- Save/load.
- PersonaDex basica.
- Audio placeholder.
- Build web jogavel.

## 22. Backlog De Producao

Milestone 1: Fundacao
- Phaser/Vite/TS.
- Resolucao 240x160.
- Input map.
- Dialog box.
- Tilemap loading.
- Player movement por grid.

Milestone 2: Batalha
- Turnos.
- Stats.
- Golpes.
- HP/EXP bars.
- Captura.
- Party.

Milestone 3: Conteudo Votuporanga
- Mapas.
- NPCs.
- Starter.
- Ginasio 1 e 2.
- Sindicato evento 1.

Milestone 4: Road Trip EUA
- Texas.
- Fronteira.
- Metro.
- Ginasios 3-5.

Milestone 5: Endgame
- Ilha Tein.
- Ginasios 6-7.
- MEMORIA ZERO.
- Kanye West.

Milestone 6: Polish
- Audio final.
- FX.
- Balanceamento.
- QA de texto.
- Otimizacao.
- Tela de creditos.

## 23. Testes E QA

Visual:
- Screenshot 240x160 sem elementos fora do grid.
- Texto nao corta em caixas.
- UI sem blur em escala 2x/3x/4x.
- Sprites legiveis em escala 1x.

Gameplay:
- Nome vazio sempre vira Matheus Benevides.
- Captura calcula multiplicadores corretos.
- 7 badges desbloqueiam flags corretas.
- Sindicato nao bloqueia progresso se jogador perder batalha.
- Save carrega party, boxes, flags e posicao.

Conteudo:
- Todos os mapas tem saidas funcionais.
- Todos os lideres possuem rematch desativado/ativado conforme flag.
- Kanye West aparece apenas uma vez apos Badge Era.
- Mandate Ball nao pode ser comprada.

## 24. Fontes Consultadas Para Votuporanga

- Turismo Votuporanga, Concha Acustica: https://turismo.votuporanga.sp.gov.br/turismo/concha-acustica/767
- Turismo Votuporanga, Parque da Cultura: https://turismo.votuporanga.sp.gov.br/turismo/parque-da-cultura/736
- Guia do Turismo Brasil, Votuporanga: https://www.guiadoturismobrasil.com/cidade/SP/1102/votuporanga
- Buser, Praca Matriz Votuporanga: https://www.buser.com.br/destinos/pontos-turisticos/sp/votuporanga-sp/praca-matriz
