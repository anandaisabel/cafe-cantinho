# Café Mania (Vostu, 2010–2016): como funcionava

Referência de design para o Café Cantinho. Montada a partir de blogs e fóruns de fãs da época
do Orkut (fontes no fim) e dos prints de referência do jogo. O jogo saiu do ar em 2016, então os
detalhes vêm de relatos de jogadores e às vezes divergem entre si. **Usamos as mecânicas como
inspiração, nunca o nome, a arte ou os textos.**

---

## 1. O ciclo principal

1. **Fogão:** você clica no fogão, escolhe um prato do livro de receitas e manda cozinhar.
   Cada prato tem tempo (de minutos a mais de 6 horas), custo, preço por porção e XP.
2. **Espera:** passando o mouse por cima, aparece o tempo que falta.
3. **Pronto:** você clica no fogão e a panela vai para um **balcão**. O número sobre o prato
   mostra quantas porções restam.
4. **Estraga:** se ficar tempo demais no fogão, a comida estraga, e o fogão precisa ser limpo
   antes de cozinhar de novo.
5. **Garçons** levam do balcão para os clientes sentados, sozinhos. Você não serve prato à mão.
6. **O cliente come, paga** em moeda comum (CaféOuro) e sai.

Pratos rápidos (nachos, X-tudo) davam pouco por vez e serviam para subir de nível; pratos longos
(churrasco de 6 h) davam muito, e eram para deixar cozinhando enquanto a pessoa estava fora.

## 2. Bebidas: a máquina de sucos 

Era um sistema **separado** da cozinha, e é a principal diferença em relação ao nosso jogo:

- Alguns clientes aparecem com um **balão com um copo** sobre a cabeça: querem suco.
- **Você mesmo clica no cliente** para servir. O garçom não participa, e a bebida não vai
  para o balcão.
- Cada suco servido gasta **energia** (de 2 a 6 por suco). A energia ficava numa barra no topo
  da tela (o "50/50" do print), recarregava com o tempo, com presentes de vizinhos ou com
  a moeda premium.
- O **bônus vem na hora**, e cada tipo de suco dava uma coisa diferente: uns davam mais
  moedas, outros mais XP, outros mais popularidade (carinhas sorrindo).
- A máquina começava **trancada numa caixa**: abria ao convidar 3 vizinhos novos ou pagando um
  "chaveiro" com a moeda premium.
- Era possível desbloquear sucos novos sem ter dominado os anteriores.

## 3. Popularidade (a "fama" do café)

- Um número de 0 a **105,0**, mostrado como uma carinha.
- **+0,1** por cliente bem atendido, e **−0,3** por cliente que vai embora irritado (sem mesa,
  sem comida ou esperando demais). Perder é 3× mais rápido que ganhar.
- Mais popularidade = mais clientes chegando.
- Decoração e cardápio variado ajudavam. Sem mesa livre, o cliente mostrava um relógio e ia
  embora.

## 4. Estrutura e progressão

- **Começava com 3 fogões e 3 balcões.** Ganhava mais nos níveis fixos (fogões: 6, 17, 26, 33…;
  balcões: 5, 13, 21, 29…).
- **Garçons:** o primeiro no nível 3, depois nos níveis 7, 15, 23, 37, 46, 50 e 59. Cada garçom
  **era um amigo** contratado, com o rosto dele. Quem era contratado ganhava gorjetas.
- **Cada nível liberava um prato novo**, e às vezes um garçom, um fogão ou um balcão.
- Os fãs recomendavam cerca de **18 mesas** até o nível 20. Os salões eram enormes e lotados
  (veja o print 3: duas fileiras longas de mesas, uns 20 clientes).
- **Conquistas** com 5 estrelas cada (servir X pratos, cozinhar pratos diferentes, convidar
  vizinhos, dar presentes, gastar moedas). A maior ("Celebridade") pagava dezenas de milhares
  de moedas.
- **Recompensa diária** de moeda premium por cozinhar todo dia.

## 5. Social (o motor do jogo)

- **Vizinhos** ficavam numa barra fixa embaixo, com foto e nível (print 1).
- **Visitar** o café de um vizinho e **ajudar a limpar** dava 1 XP por ajuda.
- **Presentes:** você mandava pratos prontos aos vizinhos (até 30 por vez). O presente chegava
  **direto no balcão**, já pronto para servir. Era a forma de ganhar comida sem cozinhar.
- **Peças de máquinas:** máquinas especiais (por exemplo, a Prateleira de Temperos) eram
  montadas com peças que você pedia aos vizinhos, uma por dia, ou comprava.
- A **expansão** do café exigia um número mínimo de vizinhos, além de moedas.

## 6. Economia

- **CaféOuro** (moeda comum): vinha de clientes, sucos e conquistas. Servia para decoração,
  máquinas e expansão.
- **CaféGrana** (premium): comprada com dinheiro real, por recompensa diária ou eventos.
  Pagava energia, destrancava coisas e acelerava a expansão.
- **Pátio externo:** comprado numa placa "À venda". Não podia ser maior que o salão.

## 7. Eventos e conteúdo especial

- **Visitantes famosos** temporários (paródias de celebridades): você clicava numa estrela
  para atendê-los e ganhava itens de coleção.
- **Pratos patrocinados** por marcas.
- **Contagem regressiva** de evento no topo da tela (a "bomba" do print 3).
- Concursos de print do café, com votação da comunidade.

## 8. Truque curioso: "prender os garçons"

Os jogadores fechavam os garçons num corredor entre fogões e balcões, cercado por mesas.
Assim eles andavam menos e serviam mais rápido. Era um efeito colateral do caminho dos
garçons, não algo planejado. **Não vale copiar.** No nosso jogo os garçons já andam pelo menor
caminho.

---

## Comparação com o Café Cantinho

| Café Mania | Café Cantinho hoje | Ideia |
|---|---|---|
| Fogão → balcão → garçom | Igual | ✅ já temos |
| Comida estraga no fogão; limpar o fogão | Queima e você descarta; prato também estraga no balcão | ✅ já temos |
| Suco: **você toca no cliente** com balão de copo, gasta energia, bônus na hora | Garçom busca na máquina e leva; o jogador escolhe o que cada máquina serve | ⭐ **Trazer**: tocar no balão para servir na hora (o código `serveDirect` já existe para pratos) |
| Barra de **energia** | Não existe | ⭐ Trazer junto com o suco |
| Cada suco dá um bônus diferente (moeda, XP, fama) | Todo drinque paga moedas + XP | ⭐ Dar "personalidade" a cada bebida |
| **Popularidade 0–105**, +0,1 / −0,3 | Existe "reputação" e a nota de qualidade, pouco visível | ⭐ Mostrar no topo como medidor com carinha |
| Garçons = amigos, com gorjeta para quem é contratado | Garçons com nomes gerados; gorjetas entre vizinhos | Contratar a vizinha como garçom no seu café |
| Presente chega pronto no balcão | Presentes são móveis e moedas no inventário | ⭐ Presentear **prato pronto** que cai no balcão da vizinha |
| Ajudar a limpar o café do vizinho | Visita dá gorjeta e presente | Limpar mesas sujas da vizinha ao visitar |
| Barra de vizinhos sempre visível | Atrás do botão "Vizinhos" | Barra fixa com a vizinha |
| Peças de máquina pedidas a vizinhos | Temperos e itens raros na feira | Peças de máquina na feira ou com a vizinha |
| Conquistas com 5 estrelas | Metas simples | Metas em estrelas |
| 18+ mesas, salão lotado | Salão pequeno no início | Expansões mais baratas no começo, mais clientes por vez |
| Visitante famoso (evento) | VIP com coroa | VIPs com bonecos especiais (pacote de personagens) |
| Recompensa diária por cozinhar | Não existe | Bônus diário simples |

### Sugestão de ordem

1. **Suco do jeito do Café Mania:** balão de copo no cliente → toque → serve na hora, gasta
   energia, bônus próprio de cada bebida. Barra de energia no topo.
2. **Medidor de popularidade** no topo (carinha + número), com +0,1 / −0,3.
3. **Presente de prato pronto** que cai no balcão da vizinha, e ajudar a limpar o café dela.
4. Barra de vizinhos fixa e contratar a vizinha como garçom.
5. Metas com estrelas e recompensa diária.

---

## Fontes

- [Vostu — Wikipedia](https://en.wikipedia.org/wiki/Vostu)
- [Café Mania — Kotaku](https://kotaku.com/games/cafe-mania) · [Backloggd](https://backloggd.com/games/cafe-mania/) · [Culga Games](https://culga.com/blog/post/cafe-mania-games/) · [Baixaki](https://www.baixaki.com.br/download/cafemania.htm)
- [Ratazana Games — dicas e cheats (2010)](http://rata-zana.blogspot.com/2010/10/cafe-mania-orkut-app-dicas-cheats.html)
- [Jogando o Café Mania — FAQ](https://jogandoocafemania.blogspot.com/p/faq.html)
- [Tempo de novidades — Jogando CaféMania](http://tempodenovidades.blogspot.com/2010/10/jogando-cafemania-mania-do-orkut.html)
- [Dicas e truques para jogar CaféMania](https://isafane.wordpress.com/2010/07/30/dicas-e-truques-para-jogar-cafemania/)
- [Jornal notícias — dicas, truques e códigos (2012)](http://jornal-noticias9.blogspot.com/2012/02/cafe-mania-dicas-truques-e-codigos.html)
- [Aplicativos do Orkut — Café Mania](https://aplicativos-para-orkut.blogspot.com/p/cafe-mania.html)
- [The Café Mania (blog, 2010)](http://thecafemania.blogspot.com/2010/)
- [Guia para iniciantes — fórum (2012)](https://darkcheats.catsboard.com/t1752-guia-para-iniciantes-cafe-mania)
- Prints de referência do jogo (salão, HUD, balão de suco, barra de energia).
