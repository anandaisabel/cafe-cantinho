# Projeto Café — Documento mestre de desenvolvimento
## 1. Direção geral do jogo
Criar um sucessor espiritual do Café Mania, preservando a essência da jogabilidade clássica de gerenciamento de restaurantes, mas modernizando a apresentação visual, a tecnologia, a experiência do usuário e os sistemas internos.
O jogo deve manter:

* Restaurante organizado em grade.
* Câmera isométrica fixa, com possibilidade de zoom.
* Salão, cozinha, balcão, mesas, cadeiras, decoração e equipamentos.
* Preparação de receitas em tempo real.
* Clientes com comportamentos e necessidades próprias.
* Funcionários com funções específicas e automatizadas.
* Economia, progressão, desbloqueios e expansão.
* Interações sociais, vizinhos, presentes e eventos.

A modernização não deve descaracterizar o jogo. O objetivo é recuperar a profundidade e a sensação de evolução do Café Mania, evitando transformar a experiência em um simulador genérico ou em um jogo de exploração livre.
Todos os sistemas precisam funcionar e estar conectados entre si. Não criar elementos meramente ilustrativos ou botões sem funcionalidade.
## 2. Sistema de preparo de receitas
As receitas devem ser preparadas em tempo real, com durações variadas, desde poucos minutos até vários dias.
Cada receita precisa ter:

* Nome.
* Imagem ou modelo visual do prato.
* Ingredientes necessários.
* Tempo de preparo.
* Quantidade de porções.
* Valor de venda.
* Experiência concedida.
* Nível necessário.
* Categoria.
* Nível de domínio da receita.

Exemplos de duração:

* Rápidas: nachos de queijo (3 min), misto quente (5–15 min), omelete e panquecas (15–30 min), hambúrguer e batatas fritas (30–60 min).
* Médias: espaguete à bolonhesa (2 h), tacos (3–4 h), lasanha e pizza (4–6 h), mousse de maracujá (4–6 h).
* Longas: salada de batata (8 h), casquinha (9 h), pamonha e vatapá (8–10 h), pimenta com alho e queijo (12 h), churrasco (12 h).
* Especiais: frango ou peru assado (24 h), sushi (24–48 h), feijoada (48 h), bolo Floresta Negra (96 h).

O preparo deve continuar enquanto o jogador estiver offline.
Quando uma receita terminar, deve existir um período de tolerância para recolhimento. Caso o prato não seja retirado a tempo, poderá queimar e perder seu valor. O sistema deve salvar os horários de início, conclusão e vencimento, sem depender de o jogador manter o jogo aberto.
## 3. Prateleira de temperos
Criar uma prateleira de temperos que permita acelerar, melhorar ou recuperar preparos.
Itens históricos de referência:

* Sal Turbinado: aumenta em 5% a quantidade de porções.
* Pimenta Poderosa: aumenta em 10% a quantidade de porções.
* Tomilho Acelerador: reduz uma hora do preparo.
* Tomilho Ultrarrápido: reduz seis horas.
* Condimento Instantâneo: conclui o preparo imediatamente.
* Sálvia Salvadora: recupera pratos queimados.

Cada item precisa ter:

* Ícone e descrição.
* Quantidade disponível.
* Compatibilidade com receitas.
* Efeito claramente informado.
* Animação ou feedback visual ao utilizar.

Os temperos podem ser recebidos de amigos, eventos, recompensas e mercado.
## 4. Livro de receitas e progressão
Criar um livro de receitas organizado por categorias e filtros.
As receitas devem ser desbloqueadas por diferentes caminhos:

* Nível do jogador.
* Café Ouro.
* Diamantes.
* Missões.
* Eventos.
* Clientes VIP.

Utilizar como referência o catálogo histórico do Café Mania, com pelo menos 115 receitas como referência inicial de variedade.
A progressão precisa ter variedade. Evitar que os níveis sejam preenchidos apenas com receitas repetitivas ou mudanças superficiais de ingredientes.
## 5. Domínio das receitas
Cada receita deve possuir cinco níveis de domínio, representados por estrelas.
Quanto mais vezes o jogador preparar determinada receita, maior será seu domínio.
A evolução pode conceder:

* Experiência adicional.
* Mais Café Ouro.
* Aumento de rendimento.
* Bônus de produção.
* Conquistas e recompensas.

O domínio deve incentivar o jogador a continuar utilizando receitas antigas, em vez de abandoná-las completamente ao subir de nível.
## 6. Decoração, popularidade e atrações
A decoração deve influenciar a popularidade do restaurante.
A popularidade pode interferir em:

* Quantidade de clientes.
* Chance de receber VIPs.
* Desbloqueio de missões.
* Expansões.
* Eventos e recompensas.

Criar conjuntos temáticos de decoração e atrações animadas.
Atrações e entretenimento
Adicionar objetos de entretenimento, como:

* Bandas musicais.
* Cantores de ópera.
* Fontes musicais.
* Fliperamas.
* Recepcionistas.
* Outras atrações temáticas.

Esses objetos devem ter animações e funções reais. Podem aumentar a popularidade, entreter clientes e, em determinados casos, acumular gorjetas ou moedas ao longo do tempo.
Quando houver uma recompensa disponível, mostrar um indicador visual de moeda sobre a atração. O jogador deve clicar para recolher.
Algumas atrações podem exigir Energia ou possuir períodos de recarga. Os limites e ciclos devem ser configuráveis.
## 7. Clientes VIP
Criar personagens VIP com identidade, aparência, personalidade e preferências próprias.
Cada VIP pode:

* Solicitar receitas específicas.
* Exigir determinadas condições do restaurante.
* Possuir missões próprias.
* Conceder recompensas especiais.
* Influenciar a popularidade.

Os VIPs devem ser personagens originais, sem depender de celebridades ou marcas licenciadas.
## 8. Identidade visual e mapa
Manter a perspectiva isométrica e a organização espacial do Café Mania.
O restaurante deve possuir:

* Salão interno.
* Cozinha.
* Calçada.
* Porta de entrada.
* Área externa.
* Espaços de expansão.

Os objetos devem ter volume e leitura visual clara. Comidas, panelas, balcões e equipamentos podem ter proporções um pouco exageradas para facilitar a identificação.
A direção visual deve ser estilizada, com aparência de jogo, sem buscar realismo excessivo.
## 9. Funcionários e automação
Os funcionários devem executar suas funções automaticamente, reduzindo a necessidade de microgerenciamento.
Chef
Responsável exclusivamente pela cozinha:

* Iniciar preparos.
* Acompanhar receitas.
* Recolher pratos concluídos.
* Levar pratos aos balcões.
* Priorizar pratos próximos de queimar.
* Considerar o espaço disponível nos balcões.

O chef não deve servir mesas nem lavar pratos.
Garçons
Responsáveis por:

* Buscar pratos nos balcões.
* Servir clientes.
* Recolher pratos sujos.
* Levar louças à pia.

Os garçons devem escolher tarefas de forma inteligente e evitar deslocamentos desnecessários.
Exceção: bebidas
As bebidas devem continuar sendo servidas manualmente pelo jogador. O garçom não deve automatizar essa ação.
## 10. Ciclo de vida dos clientes
O ciclo normal de atendimento deve ser:

1. Cliente aguarda na calçada.
2. Entra de acordo com a popularidade.
3. Procura um lugar funcional e acessível.
4. Aguarda se não houver lugar disponível.
5. Faz o pedido.
6. Garçom busca e serve o prato.
7. Caso solicite bebida, o jogador precisa servi-la manualmente.
8. Cliente consome o pedido.
9. Paga Café Ouro e concede experiência.
10. Deixa o prato sujo.
11. Vai embora.

O comportamento dos clientes deve considerar popularidade, assentos, disponibilidade de comida, limpeza, funcionários e capacidade de atendimento.
Satisfação
Criar estados visuais claros:

* Feliz: corações ou expressão sorridente.
* Impaciente: relógio, suor ou pé batendo.
* Irritado: rosto vermelho ou nuvem escura.

A insatisfação pode ocorrer por falta de lugares, demora, ausência de comida, mesas sujas ou caminhos bloqueados.
A satisfação deve influenciar a popularidade, mas sem permitir que um único cliente cause oscilações desproporcionais.
Pedido de bebida
Quando o cliente solicitar uma bebida, exibir um balão com ícone de copo.
O jogador deve clicar no pedido para entregar a bebida. Cada entrega custa uma unidade de Energia e concede Café Ouro e experiência.
## 11. Diversidade de clientes
Criar variedade de personagens, incluindo:

* Estudantes.
* Executivos.
* Idosos.
* Turistas.
* Skatistas.
* Famílias.
* Crianças.
* Outros perfis cotidianos.

Os personagens devem variar em roupas, cabelos, aparência, acessórios e animações.
Futuramente, avatares de amigos poderão aparecer como clientes ou funcionários.
## 12. Chef e funcionamento da cozinha
O chef deve permanecer na cozinha e executar as atividades relacionadas ao preparo.
Sua inteligência artificial deve priorizar:

1. Pratos concluídos.
2. Pratos próximos de queimar.
3. Espaço disponível nos balcões.
4. Organização dos deslocamentos.

A disposição compacta da cozinha pode favorecer a eficiência, mas o jogo não deve exigir um único layout ou depender de exploits.
## 13. Fogões, balcões e porções
O jogador deve começar com aproximadamente dois fogões e desbloquear mais equipamentos conforme progride.
Cada fogão prepara uma receita por vez.
Os balcões funcionam como armazenamento intermediário entre cozinha e salão. Visualmente, devem apresentar uma bandeja de comida, com capacidade de referência de aproximadamente 50 porções.
Cada prato retirado por um garçom reduz o estoque disponível.
Quando todos os balcões estiverem cheios, o chef deve aguardar ou encontrar uma alternativa, sem ignorar o risco de os pratos queimarem.
## 14. Pia e limpeza
O restaurante precisa ter pelo menos uma pia funcional.
Garçons levam os pratos sujos até ela. Equipamentos melhores, como lava-louças, podem ser desbloqueados em níveis superiores.
Uma louça suja deve bloquear somente o assento específico em que foi utilizada. Os outros lugares da mesa continuam disponíveis.
Quando a louça for lavada, o assento volta a ficar livre.
Se não houver pia acessível, o funcionário deve sinalizar o problema e a interface deve avisar o jogador. Pratos sujos não podem simplesmente desaparecer.
## 15. Grade, mesas, cadeiras e circulação
Todos os objetos devem possuir dados de grade:

* Dimensões.
* Posição.
* Rotação.
* Área ocupada.
* Regras de interação.
* Área de acesso.
* Bloqueios.

Referências de mobiliário:

* Mesa quadrada 1x1: até quatro cadeiras.
* Mesa retangular 2x1: até seis cadeiras.
* Booths: dois a quatro lugares.
* Banquetas: compatíveis com determinados balcões.

As cadeiras precisam estar conectadas à mesa e orientadas corretamente. Paredes e objetos devem bloquear acessos impossíveis.
Clientes podem entrar individualmente e compartilhar mesas com desconhecidos.
Uma cadeira bloqueada por prato sujo não deve inutilizar os outros assentos.
O garçom deve conseguir alcançar uma casa adjacente livre para servir, sem precisar ocupar o espaço da cadeira.
Recomendar corredores de aproximadamente uma casa de largura, com pathfinding que evite colisões, travamentos, impasses e assentos inacessíveis.
O layout deve permitir estratégias diferentes, como cozinha compacta ou salão mais aberto.
## 16. Máquinas de bebidas
As máquinas de bebidas são separadas dos fogões.
Exemplos:

* Máquina de sucos.
* Cafeteira.
* Máquina de sorvete.
* Liquidificadores temáticos.
* Outras máquinas futuras.

Podem ficar no salão ou próximas aos balcões.
O jogador escolhe o sabor ou tipo de bebida e inicia o preparo. Após alguns minutos, a máquina armazena várias porções.
As bebidas não queimam. Cada máquina possui estoque, capacidade, temporizador e animações próprias.
Desgaste e reparo
Após vários usos, a máquina pode apresentar desgaste, soltar fumaça ou quebrar.
O jogador deve clicar nela para realizar o reparo, consumindo Energia.
O estoque restante deve ser preservado após o conserto.
## 17. Energia do jogador
Criar uma barra de Energia, representada por um raio amarelo na interface superior.
Ela é independente da energia ou disposição dos funcionários.
A Energia é consumida em:

* Servir bebidas manualmente: uma unidade por copo.
* Reparar máquinas de bebidas.
* Recolher gorjetas de determinadas atrações.
* Ações especiais de eventos ou interações sociais.

Preparar receitas e recolher pratos comuns dos fogões não deve consumir Energia, mesmo quando o jogador estiver sem unidades disponíveis.
A Energia se regenera ao longo do tempo, inclusive com o jogo fechado.
A interface deve mostrar:

* Energia atual.
* Capacidade máxima.
* Tempo para recuperar a próxima unidade.

O jogador também pode solicitar recargas gratuitas aos vizinhos e receber itens de reposição.
Como referência histórica, a recarga instantânea pode custar quatro Diamantes. O custo precisa aparecer antes da confirmação.
Nunca cobrar recursos silenciosamente ou realizar cobranças parciais inesperadas.
## 18. Energia e turnos dos funcionários
Funcionários possuem um sistema separado de energia ou disposição.
Garçons podem ficar cansados e interromper o trabalho. O jogador poderá utilizar itens de energia ou renovar seus turnos.
O chef não deve precisar consumir energia para cozinhar no próprio restaurante.
## 19. Controle de abertura e fechamento
Adicionar controle para abrir ou fechar a porta do restaurante.
Quando fechado:

* Novos clientes não entram.
* O jogador pode reorganizar o ambiente.
* O restaurante pode ser preparado para receber clientes novamente.

A porta deve possuir animação e som de campainha.
## 20. Sistema social e vizinhos
Criar um sistema social próprio, sem depender de Orkut ou Facebook.
Presentes
Permitir envio diário de presentes gratuitos, sem consumir o estoque pessoal do jogador.
Possíveis presentes:

* Temperos.
* Ingredientes raros.
* Materiais.
* Caixas misteriosas.
* Decorações temáticas.

Lista de desejos
Cada jogador pode manter uma lista de desejos com até três itens.
Caixa de presentes
Exibir:

* Remetente.
* Imagem do item.
* Quantidade.
* Opção de aceitar.
* Opção de retribuir.

Visitas aos vizinhos
Permitir visitar restaurantes de amigos e realizar aproximadamente cinco ações diárias por vizinho.
Exemplos:

* Lavar pratos.
* Temperar preparos.
* Experimentar comidas prontas.

As ações precisam respeitar o estado real dos objetos. Algumas interações especiais podem consumir Energia.
Futuramente, amigos poderão aparecer como clientes ou funcionários.
## 21. Feira e mercado
Criar uma feira acessível e funcional, tanto em desktop quanto em dispositivos móveis.
A feira deve apresentar:

* Catálogo visual.
* Imagens dos produtos.
* Descrições.
* Preços.
* Quantidades.
* Categorias.
* Rotação periódica de itens.

Adicionar ingredientes comuns e raros, como baunilha em fava.
Alguns itens poderão ser comprados com Café Ouro e outros exclusivamente com Diamantes.
A feira deve ampliar a variedade de ingredientes e itens raros disponíveis no jogo.
A interface precisa ser fácil de navegar, sem depender de zoom ou de controles escondidos.
## 22. Eventos sazonais
Criar eventos temáticos ao longo do ano:

* Festa Junina.
* Natal.
* Páscoa.
* Halloween.
* Verão.
* Festivais gastronômicos.

Cada evento pode trazer:

* Receitas exclusivas.
* Decorações.
* Missões.
* Recompensas.
* Atrações.
* Máquinas temáticas.
* Itens de Energia.

Os eventos devem aproveitar os sistemas já existentes, sem parecerem atividades isoladas.
## 23. Economia
Manter duas moedas principais:
Café Ouro

* Moeda principal.
* Recebida pelo atendimento.
* Utilizada em compras e melhorias comuns.

Diamantes

* Moeda premium.
* Utilizada em itens especiais, ingredientes raros e acelerações específicas.

A economia deve recompensar planejamento e progressão. Não transformar todos os sistemas em funcionalidades dependentes de moeda premium.
Energia é um recurso de ação, não uma terceira moeda.
## 24. Som e ambientação
O restaurante deve parecer vivo.
Adicionar sons associados às ações:

* Campainha da porta.
* Conversas e murmúrios.
* Clientes comendo.
* Talheres e pratos.
* Copos e bebidas.
* Máquinas.
* Preparos na cozinha.
* Passos dos funcionários.
* Lavagem de louças.
* Atendimento.
* Quebra e reparo de máquinas.
* Gorjetas e atrações.

Os sons devem acompanhar as animações e os acontecimentos reais.
Oferecer controles independentes de volume para música, efeitos e ambiente.
## 25. Requisitos técnicos e testes
Todos os sistemas precisam funcionar de maneira integrada e persistente.
Garantir:

* Salvamento de estados.
* Temporizadores que continuam offline.
* Layout responsivo.
* Pathfinding confiável.
* Ausência de personagens presos.
* Grade consistente.
* Capacidade correta dos equipamentos.
* Objetos posicionados corretamente no chão.
* Temporizadores de pedidos legíveis.
* Máquinas funcionais.
* Dados escaláveis para novas receitas, personagens e itens.

Testar situações como:

* Restaurante sem comida.
* Restaurante sem assentos.
* Ausência de pia.
* Balcões cheios.
* Funcionários cansados.
* Caminhos bloqueados.
* Clientes sem conseguir sentar.
* Pratos próximos de queimar.
* Pedidos de bebida.
* Máquina vazia ou quebrada.
* Jogador sem Energia.
* Reparo de máquina.
* Gorjeta disponível.
* Regeneração offline.
* Recarga solicitada a um vizinho.
* Recarga premium.
* Restaurante fechado.
* Jogo fechado durante um preparo.

## 26. Biblioteca de assets, personagens e identidade visual
A biblioteca de assets deve servir como referência para encontrar modelos 3D, personagens, animações, alimentos, móveis e equipamentos que possam ser utilizados no desenvolvimento.
A prioridade é encontrar recursos gratuitos, com licença compatível com uso comercial, que mantenham uma identidade visual coerente.
26.1. Referências enviadas
Quaternius — Sushi Restaurant Kit
https://quaternius.com/packs/sushirestaurantkit.html

* Kit com 108 modelos.
* Personagens animados.
* Aproximadamente 30 animações.
* Alimentos, ingredientes, pratos e elementos de restaurante.
* Modelos modulares para ambientes internos.
* Formatos FBX, OBJ, Blend e glTF.
* Licença CC0, gratuita para uso pessoal e comercial.

É uma referência especialmente relevante por reunir personagens e elementos de restaurante em uma mesma coleção.
Unity Asset Store — Food FREE Low Poly 3D Models Pack
https://assetstore.unity.com/packages/3d/props/food/food-free-low-poly-3d-models-pack-260726

* Modelos 3D de alimentos.
* Estética low-poly.
* Recurso marcado como gratuito.
* Licença padrão da Unity Asset Store, não CC0.
* Verificar os termos de uso, redistribuição e utilização comercial antes de integrar ao jogo.

Sketchfab — Low Poly Characters in a Street Cafe
https://sketchfab.com/3d-models/low-poly-characters-in-a-street-cafe-668315a4edbe4f2c9eb6ecd91a567d32

* Referência visual de personagens em ambiente de cafeteria.
* Utilizar como inspiração para proporções, composição e estilo dos personagens.
* A licença e a disponibilidade para download precisam ser verificadas diretamente na página do modelo. Não presumir que seja gratuito ou liberado para uso comercial.

26.2. Bibliotecas gratuitas de personagens
Quaternius — Ultimate Animated Character Pack
https://quaternius.com/packs/ultimatedanimatedcharacter.html

* Coleção com 52 modelos.
* Mais de 50 personagens animados.
* Formatos FBX, OBJ e Blend.
* Licença CC0.
* Gratuito para uso pessoal e comercial.

Uma das principais opções para montar a base de personagens do jogo.
Gobkit — Free Character Pack Vol. 1
https://gobkit.itch.io/gobkit-free-character-pack-vol-1

* Oito personagens low-poly.
* Personagens rigados e animados.
* Arquivos GLB.
* Licença CC0.
* Rig compartilhado.
* Sete clipes de animação.
* Inclui perfis como estudante, atendente, gerente, avó e entregador.

Pode servir como referência para criar diferentes categorias de clientes e funcionários.
Kenney — Mini Characters
https://kenney.nl/assets/mini-characters

* Coleção de personagens simples.
* Arquivos com animações.
* Licença CC0.
* Gratuito para uso pessoal e comercial.

Considerar como alternativa visual, avaliando se o estilo mais simplificado combina com os demais modelos.
Poly Pizza — People & Characters
https://poly.pizza/explore/People-and-Characters?lic=1

* Biblioteca com milhares de modelos low-poly.
* Categoria específica de pessoas e personagens.
* Possui modelos estáticos, rigados e animados.
* Disponibiliza modelos em formatos como OBJ, FBX e GLTF.
* Permite filtrar modelos por licença CC0.
* Pode ser utilizada para procurar clientes, funcionários e personagens secundários.

Atenção à licença: não considerar que todos os modelos do Poly Pizza são CC0 apenas porque a biblioteca possui esse filtro. Conferir a licença na página individual de cada modelo. Alguns recursos podem exigir atribuição, como os licenciados em CC-BY. Priorizar CC0 para reduzir obrigações de atribuição e facilitar o uso comercial.
Mixamo
https://www.mixamo.com/
Utilizar principalmente como ferramenta complementar de rigging e animação para personagens humanoides compatíveis. Não é uma biblioteca de personagens com identidade visual única.
26.3. Direção visual dos personagens
Os personagens devem seguir uma estética cartoon/low-poly estilizada, com:

* Silhuetas reconhecíveis.
* Proporções levemente exageradas.
* Rostos expressivos.
* Roupas variadas.
* Cabelos e acessórios distintos.
* Animações naturais.
* Variedade de idades e estilos.

Os funcionários precisam ser visualmente identificáveis por seus uniformes e funções.
Clientes devem ter variedade suficiente para que o salão não pareça preenchido por cópias do mesmo personagem.
26.4. Animações necessárias
Clientes:

* Idle.
* Caminhar.
* Entrar no restaurante.
* Sentar.
* Esperar.
* Comer.
* Beber.
* Demonstrar satisfação.
* Demonstrar impaciência.
* Reclamar.
* Levantar.
* Ir embora.

Funcionários:

* Idle.
* Caminhar.
* Trabalhar.
* Preparar alimentos.
* Carregar pratos.
* Servir.
* Recolher louças.
* Lavar pratos.
* Reparar equipamentos.
* Descansar.

As animações precisam estar integradas aos estados reais do jogo.
26.5. Requisitos técnicos dos modelos
Priorizar modelos:

* Rigados quando precisarem de animação.
* Com topologia e quantidade de polígonos adequadas.
* Com texturas organizadas.
* Compatíveis com a perspectiva isométrica.
* Com escala consistente entre personagens e mobiliário.
* Importáveis em formatos como FBX, GLB, GLTF e Blender.

Se um personagem 3D não for adequado, sprites 2D podem ser considerados, desde que mantenham consistência visual. Nesse caso, exigir spritesheets com fundo transparente, animações de idle, caminhada, sentar e comer, além de direções e resolução adequadas.
26.6. Organização da biblioteca
Organizar os arquivos por categorias:

* Characters/Customers
* Characters/Staff
* Characters/VIP
* Characters/Animations
* Food/Ingredients
* Food/PreparedDishes
* Restaurant/Kitchen
* Restaurant/Furniture
* Restaurant/Decorations
* Restaurant/Attractions
* Props/Equipment
* UI/Icons

Registrar a origem e a licença de cada recurso.
Não misturar modelos com estilos incompatíveis. A biblioteca deve ser tratada como um conjunto de recursos para um jogo coeso, e não como uma coleção de modelos aleatórios.
26.7. Critérios de seleção e uso
Priorizar:

1. Recursos CC0.
2. Recursos gratuitos com permissão explícita de uso comercial.
3. Modelos que possam ser modificados e integrados ao jogo.
4. Personagens com rig e animações reutilizáveis.
5. Coleções que mantenham consistência visual entre si.

Não presumir que um recurso é liberado para uso comercial apenas por ser gratuito.
Verificar as permissões de uso comercial, atribuição, modificação e redistribuição dentro do jogo. Registrar a licença e a origem de cada asset antes de utilizá-lo na versão final.
Os assets devem ser integrados a sistemas funcionais. Um modelo de máquina, alimento ou personagem não deve existir apenas como decoração se sua função for representar um elemento interativo do jogo.
## 27. Sistema de contas, login e salvamento do progresso
O jogo deve possuir um sistema obrigatório de autenticação para que cada jogador tenha uma conta própria e seu progresso seja salvo de maneira permanente.
O acesso ao jogo por meio de um link não deve permitir que o jogador comece a jogar sem estar autenticado.
Ao abrir o link do jogo, o usuário deve encontrar uma tela inicial com as opções de:

* Criar uma conta.
* Entrar em uma conta existente.
* Recuperar a senha.
* Eventualmente, utilizar um método de autenticação alternativo, como Google ou outro provedor compatível.

27.1. Criação e identificação da conta
Cada jogador deve possuir um identificador único de conta, independente do navegador ou dispositivo utilizado.
A conta pode conter:

* Nome de usuário.
* E-mail.
* Senha protegida.
* Identificador único.
* Data de criação.
* Dados de progresso.
* Configurações pessoais.

O sistema nunca deve armazenar senhas em texto puro. Utilizar autenticação segura, com armazenamento protegido de credenciais e gerenciamento adequado de sessões.
27.2. Salvamento automático na nuvem
Todo o progresso deve ser vinculado à conta e salvo em um banco de dados no servidor.
Não depender exclusivamente de:

* Local Storage.
* Cookies.
* Cache do navegador.
* Dados temporários da sessão.
* Arquivos locais do dispositivo.

Esses recursos podem ser utilizados para cache ou melhoria de desempenho, mas não devem ser a fonte principal do progresso.
O salvamento deve contemplar:

* Nível e experiência.
* Café Ouro e Diamantes.
* Energia atual e tempo de regeneração.
* Receitas desbloqueadas.
* Receitas em preparo.
* Horários de início, conclusão e vencimento dos preparos.
* Estoque de ingredientes e temperos.
* Quantidade de porções nos balcões.
* Máquinas e equipamentos.
* Decorações e atrações.
* Disposição do restaurante na grade.
* Mesas, cadeiras e objetos posicionados.
* Funcionários e seus estados.
* Popularidade.
* Clientes e estados necessários para a continuidade da simulação.
* Missões e conquistas.
* Inventário.
* Presentes recebidos e enviados.
* Progresso de eventos.
* Configurações do jogador.

27.3. Salvamento automático e sincronização
O jogo deve salvar automaticamente em momentos importantes, como:

* Ao concluir uma receita.
* Ao recolher porções.
* Ao comprar ou vender itens.
* Ao posicionar ou remover objetos.
* Ao concluir uma missão.
* Ao receber recompensas.
* Ao modificar o restaurante.
* Ao alterar o inventário.
* Ao sair do jogo.

Também deve existir um mecanismo periódico de salvamento, para evitar perda de progresso em caso de fechamento inesperado.
As operações precisam ser confiáveis e evitar duplicações de compras, recompensas ou transações quando houver falha de conexão.
27.4. Continuidade entre dispositivos
O jogador deve conseguir:

1. Criar uma conta no computador.
2. Jogar e avançar no restaurante.
3. Fechar o navegador.
4. Abrir o mesmo link em outro dispositivo.
5. Entrar com a mesma conta.
6. Continuar exatamente de onde parou.

O progresso deve ser sincronizado entre dispositivos.
Se a conta estiver conectada em mais de um dispositivo, implementar uma estratégia para evitar que versões antigas do jogo sobrescrevam dados mais recentes.
27.5. Recuperação e segurança
Disponibilizar recuperação de senha por e-mail ou método seguro equivalente.
Implementar:

* Proteção das sessões.
* Validação de dados enviados ao servidor.
* Controle de acesso às informações de cada jogador.
* Proteção contra alterações indevidas de moedas, inventário e progresso.
* Tratamento de falhas de conexão.
* Expiração e renovação segura de sessões.

O servidor deve ser a fonte confiável dos dados importantes, principalmente moedas, compras, recompensas, temporizadores e inventário. Não confiar apenas nos valores enviados pelo navegador.
27.6. Experiência do usuário
A tela de login deve ser simples e combinar visualmente com a identidade do jogo.
O processo de entrada não deve ser excessivamente burocrático.
Após o primeiro login, a sessão pode permanecer ativa por um período seguro, evitando que o jogador precise digitar suas credenciais toda vez que abrir o jogo.
Incluir uma opção de sair da conta e permitir que o jogador recupere o acesso caso esqueça a senha.
Se houver perda de conexão, o jogo deve informar o jogador e tratar as alterações pendentes com segurança. Não apresentar uma falsa confirmação de salvamento quando os dados ainda não chegaram ao servidor.
27.7. Testes obrigatórios de autenticação e persistência
Testar os seguintes cenários:

* Primeiro acesso pelo link.
* Tentativa de jogar sem criar conta ou entrar.
* Cadastro de uma conta nova.
* Login em conta existente.
* Senha incorreta.
* Recuperação de senha.
* Fechamento inesperado do navegador.
* Atualização da página.
* Limpeza do cache e dos dados locais.
* Acesso pelo mesmo jogador em outro navegador.
* Acesso pelo celular e pelo computador.
* Perda temporária de internet.
* Reconexão.
* Salvamento de uma receita em andamento.
* Retorno após várias horas ou dias offline.
* Duas sessões da mesma conta abertas simultaneamente.
* Tentativa de acessar os dados de outra conta.

Critério de aprovação: um jogador deve conseguir acessar o jogo por meio do link, autenticar-se, avançar no restaurante, fechar completamente o navegador e retornar posteriormente — inclusive por outro dispositivo — sem perder seu progresso.
