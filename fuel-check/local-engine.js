/* Fuel Check — on-device estimator (no AI, no key, no network).
 * Turns free text like "2 eggs, 200 g rice, 1 beer" and "8000 steps, 45 min gym" into the same
 * JSON shape the AI returns, so the rest of the page works unchanged.
 * Nutrients per 100 g as eaten, rounded from USDA FoodData Central / German BLS typical values.
 * Activity METs from the 2024 Adult Compendium of Physical Activities (closest general entries).
 */
(function () {
  'use strict';
  // p, c (available carbs), f, fib, sat, sug (free sugar), alc  — per 100 g.  por = typical portion (g), pc = one piece (g), sl = one slice (g)
  const F = [
    // eggs, dairy
    { k: 'egg', n: [12.6, 0.7, 9.5, 0, 3.1, 0, 0], por: 100, pc: 50, a: 'egg,eggs,boiled egg,eier,ei,gekochtes ei,yumurta,haslanmis yumurta,huevo,huevos,oeuf,oeufs,uovo,uova,ovo,ovos,eieren,jajko,jajka,яйцо,яйца,яйце' },
    { k: 'fried egg', n: [13.6, 0.8, 14.8, 0, 4.3, 0, 0], por: 100, pc: 50, a: 'fried egg,fried eggs,scrambled egg,scrambled eggs,omelette,omelet,spiegelei,spiegeleier,ruhrei,omelett,sahanda yumurta,omlet,menemen,huevo frito,huevos revueltos,tortilla francesa,oeuf au plat,oeufs brouilles,uova strapazzate,frittata,ovo frito,ovos mexidos,omelete,roerei,jajecznica,омлет,яичница' },
    { k: 'milk', n: [3.3, 4.8, 3.4, 0, 2.1, 0, 0], por: 250, a: 'milk,whole milk,milch,vollmilch,sut,leche,lait,latte intero,leite,melk,mleko,молоко' },
    { k: 'low-fat milk', n: [3.4, 5, 1.5, 0, 1, 0, 0], por: 250, a: 'skim milk,low fat milk,semi skimmed milk,fettarme milch,magermilch,yagsiz sut,leche desnatada,lait ecreme,latte scremato,leite desnatado,magere melk,mleko odtluszczone' },
    { k: 'plant milk', n: [1, 3, 1.5, 0.3, 0.2, 2, 0], por: 250, a: 'oat milk,soy milk,almond milk,hafermilch,sojamilch,mandelmilch,yulaf sutu,soya sutu,badem sutu,leche de avena,leche de soja,lait d avoine,lait de soja' },
    { k: 'yogurt', n: [3.5, 4.7, 3.3, 0, 2.1, 0, 0], por: 150, a: 'yogurt,yoghurt,joghurt,yogurt naturale,yogur,yaourt,iogurte,jogurt,йогурт,yogurt,yoğurt,yogurt plain' },
    { k: 'ayran', n: [1.7, 2, 1.7, 0, 1.1, 0, 0], por: 250, a: 'ayran,kefir,buttermilk,buttermilch,dugh,lassi' },
    { k: 'greek yogurt', n: [9, 4, 5, 0, 3.2, 0, 0], por: 170, a: 'greek yogurt,greek yoghurt,griechischer joghurt,suzme yogurt,yogur griego,yaourt grec,yogurt greco,iogurte grego' },
    { k: 'fruit yogurt', n: [3.5, 15, 2.5, 0.2, 1.6, 10, 0], por: 150, a: 'fruit yogurt,fruchtjoghurt,meyveli yogurt,yogur de frutas,yaourt aux fruits,yogurt alla frutta' },
    { k: 'quark', n: [12, 4, 0.3, 0, 0.2, 0, 0], por: 250, a: 'quark,skyr,magerquark,curd,lor peyniri,cottage cheese,huttenkase,körniger frischkase,kwark,twarog' },
    { k: 'cheese', n: [25, 1.3, 33, 0, 19, 0, 0], por: 30, sl: 20, a: 'cheese,cheddar,gouda,emmental,kase,kasar,peynir,queso,fromage,formaggio,queijo,kaas,ser,сыр,parmesan,edamer' },
    { k: 'mozzarella', n: [22, 2.2, 22, 0, 13, 0, 0], por: 125, a: 'mozzarella,burrata' },
    { k: 'feta', n: [14, 4, 21, 0, 15, 0, 0], por: 30, a: 'feta,beyaz peynir,schafskase,hirtenkase,queso feta' },
    { k: 'cream cheese', n: [6, 4, 30, 0, 19, 0, 0], por: 30, a: 'cream cheese,frischkase,philadelphia,krem peynir,queso crema' },
    { k: 'butter', n: [0.9, 0.1, 81, 0, 51, 0, 0], por: 10, a: 'butter,tereyag,tereyagi,mantequilla,beurre,burro,manteiga,boter,maslo,масло сливочное' },
    { k: 'oil', n: [0, 0, 100, 0, 14, 0, 0], por: 10, a: 'oil,olive oil,olivenol,ol,zeytinyagi,yag,aceite,huile,olio,azeite,olie,oliwa,olej,масло' },
    { k: 'cream', n: [2.4, 3.2, 30, 0, 19, 0, 0], por: 30, a: 'cream,sahne,schlagsahne,krema,nata,creme fraiche,panna,smetana' },
    // bread, cereals
    { k: 'bread', n: [9, 47, 3.2, 2.7, 0.7, 4, 0], por: 60, sl: 30, pc: 30, a: 'bread,white bread,toast,toastbrot,weissbrot,brot,ekmek,beyaz ekmek,pan,pan blanco,pain,pane,pao,brood,chleb,хлеб,baguette,ciabatta' },
    { k: 'wholegrain bread', n: [12, 38, 3.5, 7, 0.7, 3, 0], por: 64, sl: 32, pc: 32, a: 'wholegrain bread,whole wheat bread,brown bread,rye bread,vollkornbrot,roggenbrot,schwarzbrot,graubrot,tam bugday ekmegi,cavdar ekmegi,pan integral,pain complet,pane integrale,pao integral,volkorenbrood,chleb razowy,pumpernickel' },
    { k: 'bread roll', n: [9, 52, 2, 2.5, 0.4, 2, 0], por: 60, pc: 60, a: 'bread roll,roll,bun,brotchen,semmel,schrippe,weckle,kaiserbrotchen,pogaca,panecillo,petit pain,panino,pao frances,broodje,bulka' },
    { k: 'pretzel', n: [9, 55, 3, 2.4, 0.6, 1, 0], por: 90, pc: 90, a: 'pretzel,brezel,breze' },
    { k: 'croissant', n: [8.2, 43, 21, 2.6, 11.7, 11, 0], por: 60, pc: 60, a: 'croissant,cornetto,mini croissant,gipfeli,hornchen' },
    { k: 'simit', n: [10, 55, 6, 3, 1.5, 3, 0], por: 100, pc: 100, a: 'simit,bagel' },
    { k: 'oats', n: [13, 58, 6.5, 10, 1.1, 0, 0], por: 50, a: 'oats,oatmeal,rolled oats,haferflocken,yulaf,yulaf ezmesi,avena,copos de avena,flocons d avoine,fiocchi d avena,aveia,havermout,platki owsiane,овсянка' },
    { k: 'porridge', n: [2.5, 12, 1.5, 1.7, 0.3, 0, 0], por: 250, a: 'porridge,haferbrei,porridge oats,gachas,bouillie,porridge di avena,mingau,pap,owsianka,каша' },
    { k: 'muesli', n: [10, 55, 7, 8, 1, 12, 0], por: 60, a: 'muesli,musli,granola,knuspermusli,granola bar' },
    { k: 'cereal', n: [7, 80, 1, 3, 0.2, 10, 0], por: 40, a: 'cereal,cornflakes,cereals,frosties,froot loops,mısır gevregi,misir gevregi,cereales,cereales,cereali' },
    { k: 'rice', n: [2.7, 28, 0.3, 0.4, 0.1, 0, 0], por: 180, a: 'rice,white rice,basmati,reis,pilav,pirinc,arroz,riz,riso,rijst,ryz,рис,risotto,fried rice,gebratener reis' },
    { k: 'brown rice', n: [2.6, 21, 0.9, 1.8, 0.2, 0, 0], por: 180, a: 'brown rice,vollkornreis,naturreis,esmer pirinc,arroz integral,riz complet,riso integrale' },
    { k: 'bulgur', n: [3.1, 14, 0.2, 4.5, 0.1, 0, 0], por: 180, a: 'bulgur,bulgur pilavi,couscous,kuskus,quinoa' },
    { k: 'pasta', n: [5.8, 29, 0.9, 1.8, 0.2, 0, 0], por: 220, a: 'pasta,noodles,nudeln,spaghetti,penne,fusilli,makarna,eriste,macarrones,pates,pate,macarrao,massa,makaron,макароны,tagliatelle,maultaschen,spatzle,spaetzle' },
    { k: 'spaghetti bolognese', n: [7, 16, 5, 1.5, 2, 1, 0], por: 400, a: 'spaghetti bolognese,bolognese,spaghetti bolo,pasta bolognese,lasagne,lasagna,bolonez soslu makarna' },
    { k: 'potato', n: [1.9, 17.5, 0.1, 1.8, 0, 0, 0], por: 200, pc: 150, a: 'potato,potatoes,boiled potatoes,kartoffel,kartoffeln,salzkartoffeln,patates,haslanmis patates,patata,patatas,pomme de terre,pommes de terre,patate,batata,batatas,aardappel,aardappelen,ziemniak,ziemniaki,картофель,картошка,mashed potatoes,kartoffelbrei,puree' },
    { k: 'fries', n: [3.4, 38, 15, 3.8, 2.3, 0, 0], por: 130, a: 'fries,french fries,chips (fries),pommes,pommes frites,patates kizartmasi,patatas fritas,frites,patatine fritte,batata frita,friet,patat,frytki,картофель фри' },
    { k: 'crisps', n: [6.5, 50, 34, 4.4, 3.5, 0, 0], por: 40, a: 'crisps,potato chips,chips,kartoffelchips,cips,patatas fritas de bolsa,chips de pommes de terre,patatine,batata chips' },
    { k: 'pancake', n: [6, 28, 9, 1, 2.5, 5, 0], por: 150, pc: 75, a: 'pancake,pancakes,pfannkuchen,eierkuchen,crepe,crepes,krep,pankek,tortitas,panqueques,frittelle,panqueca,pannenkoek,nalesnik' },
    // fruit & veg
    { k: 'banana', n: [1.1, 20.2, 0.3, 2.6, 0.1, 0, 0], por: 118, pc: 118, a: 'banana,bananas,banane,bananen,muz,platano,banane,banaan,banan,банан' },
    { k: 'apple', n: [0.3, 11.4, 0.2, 2.4, 0, 0, 0], por: 180, pc: 180, a: 'apple,apples,apfel,apfel,elma,manzana,pomme,mela,maca,appel,jablko,яблоко,pear,birne,armut,pera,poire' },
    { k: 'orange', n: [0.9, 9.4, 0.1, 2.4, 0, 0, 0], por: 130, pc: 130, a: 'orange,oranges,orangen,apfelsine,portakal,naranja,arancia,laranja,sinaasappel,pomarancza,апельсин,mandarin,mandarine,mandalina,clementine,mandarina' },
    { k: 'berries', n: [0.7, 8, 0.3, 2.2, 0, 0, 0], por: 150, a: 'berries,strawberries,blueberries,raspberries,erdbeeren,heidelbeeren,blaubeeren,himbeeren,beeren,cilek,yaban mersini,ahududu,fresas,arandanos,frambuesas,fraises,myrtilles,framboises,fragole,mirtilli,lamponi,morangos,mirtilos,aardbeien,blauwe bessen,truskawki,borowki,клубника,черника,cherries,kirschen,kiraz,cerezas' },
    { k: 'grapes', n: [0.7, 17.2, 0.2, 0.9, 0, 0, 0], por: 150, a: 'grapes,trauben,weintrauben,uzum,uvas,raisin,uva,druiven,winogrona,виноград' },
    { k: 'melon', n: [0.6, 7.2, 0.2, 0.4, 0, 0, 0], por: 280, a: 'watermelon,melon,wassermelone,melone,karpuz,kavun,sandia,melon,pasteque,anguria,melancia,watermeloen,arbuz,арбуз' },
    { k: 'fruit', n: [0.8, 12, 0.3, 2, 0, 0, 0], por: 150, a: 'fruit,obst,frucht,fruchte,meyve,fruta,fruits,frutta,fruit salad,obstsalat,meyve salatasi,kiwi,peach,pfirsich,seftali,mango,pineapple,ananas,plum,pflaume,erik' },
    { k: 'dried fruit', n: [2.5, 64, 0.4, 7, 0, 0, 0], por: 40, pc: 8, a: 'dates,datteln,hurma,datiles,dattes,datteri,tamaras,raisins,rosinen,kuru uzum,dried fruit,trockenobst,kuru meyve,dried apricots,kuru kayisi' },
    { k: 'avocado', n: [2, 1.8, 14.7, 6.7, 2.1, 0, 0], por: 100, pc: 150, a: 'avocado,avokado,aguacate,avocat,abacate,awokado,guacamole' },
    { k: 'salad', n: [1.4, 2.5, 0.2, 1.6, 0, 0, 0], por: 150, a: 'salad,green salad,mixed salad,salat,gruner salat,beilagensalat,salata,coban salata,ensalada,salade,insalata,salada,sla,salatka,салат,lettuce,kopfsalat,marul,cucumber,gurke,salatalik,pepino,concombre,cetriolo,komkommer,tomato,tomatoes,tomate,tomaten,domates,pomodoro,pomodori,tomaat,pomidor,помидор' },
    { k: 'vegetables', n: [2.2, 5.5, 0.3, 3, 0.1, 0, 0], por: 150, a: 'vegetables,veggies,veg,gemuse,sebze,verduras,verdura,legumes,verdure,legumes,groente,groenten,warzywa,овощи,broccoli,brokkoli,brokoli,carrot,carrots,karotte,karotten,mohren,havuc,zanahoria,carotte,carota,cenoura,wortel,marchew,spinach,spinat,ispanak,espinacas,epinards,spinaci,zucchini,kabak,courgette,peppers,paprika,biber,pimiento,poivron,peperoni,cauliflower,blumenkohl,karnabahar,green beans,grune bohnen,taze fasulye,mushrooms,pilze,champignons,mantar,setas,corn,misir' },
    { k: 'olives', n: [0.8, 3.8, 15, 3.3, 2, 0, 0], por: 30, a: 'olives,oliven,zeytin,aceitunas,olive,azeitonas' },
    // legumes, nuts
    { k: 'lentils', n: [9, 14, 0.4, 7.9, 0.1, 0, 0], por: 200, a: 'lentils,linsen,mercimek,lentejas,lentilles,lenticchie,lentilhas,linzen,soczewica,чечевица,dal,dhal' },
    { k: 'lentil soup', n: [4, 9, 2, 2.5, 0.4, 0, 0], por: 300, a: 'lentil soup,linsensuppe,mercimek corbasi,sopa de lentejas,soupe de lentilles' },
    { k: 'beans', n: [8.9, 19, 2.6, 7.6, 0.3, 0, 0], por: 160, a: 'beans,chickpeas,kidney beans,bohnen,kichererbsen,kidneybohnen,nohut,fasulye,kuru fasulye,barbunya,garbanzos,frijoles,alubias,pois chiches,haricots,ceci,fagioli,grao de bico,feijao,bonen,kikkererwten,fasola,ciecierzyca,фасоль,нут,baked beans' },
    { k: 'hummus', n: [8, 9.6, 17, 6, 2.3, 0, 0], por: 60, a: 'hummus,humus' },
    { k: 'falafel', n: [13, 32, 18, 5, 2.5, 0, 0], por: 120, pc: 17, a: 'falafel' },
    { k: 'tofu', n: [8, 1.9, 4.8, 0.3, 0.7, 0, 0], por: 150, a: 'tofu' },
    { k: 'nuts', n: [21, 9.5, 50, 12.5, 3.8, 0, 0], por: 30, a: 'nuts,almonds,walnuts,hazelnuts,cashews,nusse,mandeln,walnusse,haselnusse,ceviz,badem,findik,kaju,frutos secos,almendras,nueces,noix,amandes,noci,mandorle,nozes,amendoas,noten,amandelen,orzechy,migdaly,орехи,миндаль,pistachios,pistazien,fistik,antep fistigi' },
    { k: 'peanuts', n: [26, 7.6, 49, 8.5, 6.8, 0, 0], por: 30, a: 'peanuts,erdnusse,yer fistigi,cacahuetes,mani,cacahuetes,arachidi,amendoim,pinda,orzeszki ziemne' },
    { k: 'peanut butter', n: [25, 13, 50, 6, 10, 5, 0], por: 16, a: 'peanut butter,erdnussbutter,fistik ezmesi,mantequilla de cacahuete,beurre de cacahuete,burro di arachidi,pasta de amendoim,pindakaas,maslo orzechowe' },
    // meat, fish
    { k: 'chicken breast', n: [31, 0, 3.6, 0, 1, 0, 0], por: 150, pc: 170, a: 'chicken breast,grilled chicken,hahnchenbrust,hahnchenbrustfilet,putenbrust,turkey breast,tavuk gogsu,izgara tavuk,hindi,pechuga de pollo,pollo a la plancha,blanc de poulet,petto di pollo,peito de frango,kipfilet,piers z kurczaka,куриная грудка' },
    { k: 'chicken', n: [27, 0, 13.6, 0, 3.8, 0, 0], por: 150, a: 'chicken,hahnchen,hendl,huhn,chicken wings,chicken thigh,nuggets,chicken nuggets,tavuk,pollo,poulet,frango,kip,kurczak,курица,turkey,pute,truthahn' },
    { k: 'beef', n: [26, 0, 15, 0, 6, 0, 0], por: 180, a: 'beef,steak,rindfleisch,rind,dana,biftek,kirmizi et,ternera,carne de res,bistec,boeuf,manzo,bistecca,carne bovina,bife,rundvlees,biefstuk,wolowina,говядина,lamb,lammfleisch,kuzu,cordero,agneau,agnello' },
    { k: 'minced meat', n: [26, 0, 17, 0, 6.7, 0, 0], por: 120, pc: 100, a: 'minced meat,ground beef,mince,hackfleisch,hack,kiyma,kofte,koefte,meatballs,frikadelle,frikadellen,bulette,albondigas,carne picada,boulettes,viande hachee,polpette,carne moida,gehakt,mielone,фарш,котлета' },
    { k: 'pork', n: [27, 0, 14, 0, 5, 0, 0], por: 150, a: 'pork,schweinefleisch,schwein,kotelett,cerdo,porc,maiale,porco,varkensvlees,wieprzowina,свинина' },
    { k: 'schnitzel', n: [20, 12, 13, 0.6, 3, 0, 0], por: 180, pc: 180, a: 'schnitzel,wiener schnitzel,cordon bleu,escalope,milanesa,cotoletta,kotlet schabowy,шницель' },
    { k: 'sausage', n: [13, 2, 28, 0, 10, 0, 0], por: 100, pc: 100, a: 'sausage,sausages,bratwurst,wurst,wurstchen,wiener,bockwurst,hot dog,hotdog,sosis,salchicha,saucisse,salsiccia,salsicha,worst,kielbasa,колбаса,сосиска' },
    { k: 'currywurst', n: [11, 10, 19, 0.5, 7, 6, 0], por: 250, pc: 250, a: 'currywurst' },
    { k: 'sucuk', n: [21, 2, 34, 0, 13, 0, 0], por: 50, a: 'sucuk,chorizo' },
    { k: 'ham', n: [18, 1.5, 4, 0, 1.3, 0, 0], por: 50, sl: 25, a: 'ham,schinken,kochschinken,jambon,jamon,prosciutto,presunto,ham,szynka,ветчина,turkey ham,hindi fume,putenschinken' },
    { k: 'salami', n: [22, 1.5, 34, 0, 12, 0, 0], por: 30, sl: 10, a: 'salami,pepperoni,mortadella,lyoner,fleischwurst,salam' },
    { k: 'bacon', n: [37, 1.4, 42, 0, 14, 0, 0], por: 30, sl: 8, a: 'bacon,speck,bacon strips,pastirma,tocino,lard,lardons,pancetta,spek,boczek,бекон' },
    { k: 'salmon', n: [25, 0, 12, 0, 2.5, 0, 0], por: 150, a: 'salmon,lachs,somon,salmon,saumon,salmone,salmao,zalm,losos,лосось' },
    { k: 'tuna', n: [25, 0, 1, 0, 0.3, 0, 0], por: 130, a: 'tuna,thunfisch,ton baligi,atun,thon,tonno,atum,tonijn,tunczyk,тунец' },
    { k: 'fish', n: [23, 0, 2, 0, 0.4, 0, 0], por: 150, a: 'fish,fisch,fischfilet,balik,pescado,poisson,pesce,peixe,vis,ryba,рыба,cod,kabeljau,seelachs,tilapia,shrimp,prawns,garnelen,karides,gambas,crevettes,gamberi,camarao' },
    { k: 'fish sticks', n: [12, 21, 11, 1, 2, 1, 0], por: 150, pc: 30, a: 'fish sticks,fish fingers,fischstabchen,balik kroket' },
    // dishes
    { k: 'pizza', n: [11, 30, 10, 2, 4.5, 1.5, 0], por: 350, pc: 350, sl: 110, a: 'pizza,pide' },
    { k: 'burger', n: [13, 24, 12, 1.4, 5, 4, 0], por: 200, pc: 200, a: 'burger,hamburger,cheeseburger,big mac,whopper,chicken burger' },
    { k: 'doner', n: [11, 22, 10, 1.5, 4, 1, 0], por: 350, pc: 350, a: 'doner,doner kebab,doner kebap,kebab,kebap,durum,dürüm,gyros,shawarma,schawarma,doner box,donerbox,iskender' },
    { k: 'lahmacun', n: [11, 33, 7, 2, 2.5, 1, 0], por: 170, pc: 170, a: 'lahmacun' },
    { k: 'borek', n: [9, 27, 17, 1.5, 7, 0, 0], por: 150, pc: 150, a: 'borek,börek,gozleme,su boregi,sigara boregi,poğaça,pogaca peynirli' },
    { k: 'sandwich', n: [13, 28, 11, 2, 4.5, 3, 0], por: 200, pc: 200, a: 'sandwich,sandwiches,sub,subway,belegtes brot,belegtes brotchen,kasebrot,tost,karisik tost,bocadillo,sandwich mixto,panino,sanduiche,tosti,kanapka,бутерброд,сэндвич' },
    { k: 'wrap', n: [9, 25, 8, 2.5, 3, 1, 0], por: 250, pc: 250, a: 'wrap,burrito,tortilla wrap,quesadilla,taco,tacos' },
    { k: 'sushi', n: [6, 30, 2, 0.5, 0.4, 3, 0], por: 240, pc: 30, a: 'sushi,maki,nigiri,california roll' },
    { k: 'instant noodles', n: [2.5, 13, 5, 0.6, 2.4, 0, 0], por: 350, a: 'instant noodles,ramen,cup noodles,yum yum,instant nudeln,hazir eriste' },
    { k: 'curry', n: [8, 8, 7, 1.5, 3, 1, 0], por: 350, a: 'curry,chicken curry,tikka masala,butter chicken,chili con carne,stew,eintopf,gulasch,goulash,guveç,guvec,yahni,kuru fasulye yemegi' },
    { k: 'soup', n: [1.5, 5, 1.5, 1, 0.5, 0, 0], por: 300, a: 'soup,suppe,corba,sopa,soupe,zuppa,minestrone,soep,zupa,суп,brühe,bruhe,broth,gemusesuppe,tomatensuppe' },
    { k: 'salad bowl', n: [8, 10, 7, 3, 1.5, 1, 0], por: 350, a: 'chicken salad,caesar salad,salad bowl,poke,poke bowl,buddha bowl' },
    // sweets, snacks
    { k: 'chocolate', n: [7.6, 51, 30, 3.4, 18, 50, 0], por: 25, pc: 25, a: 'chocolate,milk chocolate,schokolade,schoki,cikolata,chocolate con leche,chocolat,cioccolato,chocolate ao leite,chocolade,czekolada,шоколад,kinder,snickers,mars,twix,kitkat,bounty,schokoriegel' },
    { k: 'dark chocolate', n: [8, 34, 43, 11, 24, 24, 0], por: 25, a: 'dark chocolate,zartbitter,zartbitterschokolade,bitter cikolata,chocolate negro,chocolat noir,cioccolato fondente,chocolate amargo,pure chocolade,gorzka czekolada' },
    { k: 'cookie', n: [5.5, 64, 22, 2, 10, 30, 0], por: 30, pc: 15, a: 'cookie,cookies,biscuit,biscuits,keks,kekse,plätzchen,platzchen,bisküvi,biskuvi,kurabiye,galleta,galletas,biscuit,gateau sec,biscotti,biscoito,bolacha,koekje,koekjes,ciastko,ciastka,печенье,oreo' },
    { k: 'cake', n: [5, 50, 18, 1, 8, 30, 0], por: 100, pc: 100, sl: 100, a: 'cake,kuchen,torte,pasta (cake),kek,tarta,pastel,gateau,torta,bolo,taart,cake,ciasto,торт,muffin,muffins,brownie,donut,doughnut,berliner,krapfen,baklava,kunefe,cheesecake,kasekuchen,tiramisu' },
    { k: 'ice cream', n: [3.5, 24, 11, 0.7, 7, 21, 0], por: 100, pc: 65, a: 'ice cream,eis,speiseeis,eiscreme,dondurma,helado,glace,gelato,sorvete,ijs,lody,мороженое' },
    { k: 'sweets', n: [6.9, 77, 0.2, 0, 0, 60, 0], por: 30, a: 'sweets,candy,gummy bears,gummibärchen,gummibarchen,haribo,süßigkeiten,sussigkeiten,bonbons,seker (candy),sekerleme,lokum,chuches,caramelos,bonbons,caramelle,doces,snoep,cukierki,конфеты' },
    { k: 'popcorn', n: [9, 60, 28, 10, 5, 0, 0], por: 30, a: 'popcorn,patlamis misir,palomitas,pop corn' },
    { k: 'sugar', n: [0, 100, 0, 0, 0, 100, 0], por: 8, a: 'sugar,zucker,seker,azucar,sucre,zucchero,acucar,suiker,cukier,сахар' },
    { k: 'honey', n: [0.3, 82, 0, 0, 0, 82, 0], por: 20, a: 'honey,honig,bal,miel,miele,mel,honing,miod,мёд,мед,syrup,sirup,maple syrup,pekmez' },
    { k: 'jam', n: [0.4, 60, 0.1, 1, 0, 50, 0], por: 20, a: 'jam,marmelade,konfitüre,konfiture,recel,mermelada,confiture,marmellata,geleia,jam,dzem,варенье' },
    { k: 'nutella', n: [6, 57, 31, 3.4, 10.6, 56, 0], por: 15, a: 'nutella,nougatcreme,schokocreme,nusscreme,chocolate spread,cikolatali krema,nocilla' },
    { k: 'ketchup', n: [1, 24, 0.1, 0.3, 0, 22, 0], por: 17, a: 'ketchup,bbq sauce,barbecue sauce' },
    { k: 'mayonnaise', n: [1, 0.6, 75, 0, 11.7, 0, 0], por: 15, a: 'mayonnaise,mayo,mayonez,mayonesa,maionese,majonez,майонез,aioli,remoulade,dressing,salad dressing,salatdressing' },
    { k: 'sauce', n: [1.5, 8, 5, 1, 1.5, 3, 0], por: 60, a: 'sauce,sosse,sose,sos,salsa,tomato sauce,tomatensosse,pesto,gravy,bratensosse' },
    // drinks
    { k: 'coffee', n: [0.1, 0, 0, 0, 0, 0, 0], por: 240, a: 'coffee,black coffee,espresso,kaffee,schwarzer kaffee,kahve,turk kahvesi,filtre kahve,cafe,caffe,koffie,kawa,кофе,americano' },
    { k: 'milk coffee', n: [2.3, 3.4, 2.2, 0, 1.3, 0, 0], por: 240, a: 'cappuccino,latte,latte macchiato,flat white,milchkaffee,kaffee mit milch,coffee with milk,sutlu kahve,cafe con leche,cafe au lait,cafe creme,caffe latte,galao,koffie verkeerd,kawa z mlekiem,капучино,латте' },
    { k: 'tea', n: [0, 0.2, 0, 0, 0, 0, 0], por: 240, a: 'tea,tee,cay,çay,te,the,tè,cha,thee,herbata,чай,green tea,gruner tee,yesil cay' },
    { k: 'water', n: [0, 0, 0, 0, 0, 0, 0], por: 250, a: 'water,wasser,su,agua,eau,acqua,agua,water,woda,вода,mineral water,sparkling water,sprudel,maden suyu' },
    { k: 'soda', n: [0, 10.6, 0, 0, 0, 10.6, 0], por: 330, a: 'cola,coke,coca cola,pepsi,fanta,sprite,soda,soft drink,limonade,limo,gazoz,refresco,refresco de cola,boisson gazeuse,bibita,refrigerante,frisdrank,napoj gazowany,газировка,iced tea,eistee,ice tea,fuse tea' },
    { k: 'energy drink', n: [0, 11, 0, 0, 0, 11, 0], por: 250, a: 'energy drink,red bull,monster,energy,enerji icecegi' },
    { k: 'diet soda', n: [0, 0, 0, 0, 0, 0, 0], por: 330, a: 'diet coke,coke zero,cola zero,pepsi max,light cola,zero,diet soda' },
    { k: 'juice', n: [0.7, 10, 0.2, 0.2, 0, 8.4, 0], por: 250, a: 'juice,orange juice,apple juice,saft,orangensaft,apfelsaft,apfelschorle,meyve suyu,portakal suyu,zumo,jugo,jus,jus d orange,succo,suco,sap,sinaasappelsap,sok,сок,smoothie' },
    { k: 'beer', n: [0.5, 3.6, 0, 0, 0, 0, 3.9], por: 500, a: 'beer,beers,bier,biere,pils,weizen,weissbier,helles,radler,bira,cerveza,biere,birra,cerveja,bier,piwo,пиво' },
    { k: 'wine', n: [0.1, 2.6, 0, 0, 0, 0, 10.5], por: 150, a: 'wine,red wine,white wine,wein,rotwein,weisswein,sekt,prosecco,champagne,sarap,vino,vin,vinho,wijn,wino,вино' },
    { k: 'spirits', n: [0, 0, 0, 0, 0, 0, 33], por: 40, a: 'vodka,whisky,whiskey,rum,gin,tequila,raki,schnaps,schnapps,shot,shots,jagermeister,ouzo,cognac,brandy,водка' },
    { k: 'protein shake', n: [78, 8, 6, 0, 3, 0, 0], por: 30, a: 'protein shake,whey,whey protein,protein powder,proteinshake,eiweissshake,eiweiss shake,protein tozu,batido de proteinas,shake proteine' },
    { k: 'protein bar', n: [33, 35, 15, 5, 6, 10, 0], por: 60, pc: 60, a: 'protein bar,proteinriegel,protein bar,barrita de proteinas,barre proteinee' },
    { k: 'cereal bar', n: [6, 65, 15, 5, 5, 25, 0], por: 25, pc: 25, a: 'cereal bar,muesli bar,musliriegel,muslibar' }
  ];

  // Activities: MET values (2024 Adult Compendium, closest general entries)
  const ACT = [
    { k: 'gym', met: 3.5, min: 60, strength: 1, a: 'gym,weights,weight training,weightlifting,lifting,strength training,resistance training,bodybuilding,krafttraining,fitnessstudio,fitness studio,gewichte,pumpen,spor salonu,agirlik,fitness,gimnasio,pesas,musculation,salle de sport,palestra,pesi,academia,musculacao,sportschool,krachttraining,silownia,trening silowy,тренажерный,тренажёрный,качалка,crossfit,calisthenics,push ups,pushups,liegestutze,sinav,squats,kniebeugen' },
    { k: 'run', met: 9.0, min: 30, kmh: 10, a: 'run,running,ran,jog,jogging,jogged,laufen,gelaufen,joggen,gejoggt,kosu,kostum,kosmak,correr,corri,trotar,course a pied,courir,couru,footing,corsa,correre,corso,corrida,corri,hardlopen,gerend,rennen,bieganie,biegalem,бег,бегал,пробежка,treadmill,laufband' },
    { k: 'walk', met: 3.5, min: 30, kmh: 5, a: 'walk,walking,walked,spazieren,spaziergang,gehen,gegangen,yuruyus,yurudum,yurumek,caminar,camine,paseo,marche,marcher,promenade,camminata,passeggiata,caminhada,caminhar,wandelen,gewandeld,spacer,chodzenie,ходьба,прогулка,spaziergang' },
    { k: 'hike', met: 6.0, min: 120, kmh: 4, a: 'hike,hiking,wanderung,wandern,trekking,doga yuruyusu,senderismo,randonnee,escursione,trilha' },
    { k: 'bike', met: 7.0, min: 45, kmh: 18, a: 'bike,biking,cycling,cycled,bicycle,ebike,fahrrad,radfahren,rad gefahren,radtour,bisiklet,pedal,ciclismo,bicicleta,bici,velo,faire du velo,ciclismo,pedalare,pedalar,fietsen,gefietst,rower,jazda na rowerze,велосипед,spinning,indoor cycling' },
    { k: 'swim', met: 6.0, min: 45, a: 'swim,swimming,swam,schwimmen,geschwommen,yuzme,yuzdum,nadar,nadando,natacion,nager,natation,nuotare,nuoto,natacao,zwemmen,plywanie,плавание' },
    { k: 'football', met: 7.0, min: 60, a: 'football,soccer,fussball,futbol,halisaha,calcio,futebol,voetbal,pilka nozna,футбол' },
    { k: 'basketball', met: 6.5, min: 60, a: 'basketball,basketbol,baloncesto,basket,pallacanestro,basquete,koszykowka,баскетбол' },
    { k: 'tennis', met: 7.3, min: 60, a: 'tennis,tenis,padel,squash,badminton' },
    { k: 'volleyball', met: 4.0, min: 60, a: 'volleyball,voleybol,voleibol,volley,pallavolo,siatkowka,волейбол,table tennis,tischtennis,masa tenisi,ping pong' },
    { k: 'hiit', met: 8.0, min: 30, a: 'hiit,circuit training,zirkeltraining,tabata,bootcamp,intervall,interval training,boxing,boxen,boks,boxeo,boxe,kickboxing,martial arts,kampfsport,karate,judo,taekwondo,mma,jump rope,seilspringen,ip atlama' },
    { k: 'yoga', met: 2.8, min: 45, a: 'yoga,pilates,stretching,dehnen,esneme,estiramientos,mobility' },
    { k: 'dance', met: 5.0, min: 60, a: 'dance,dancing,tanzen,dans,bailar,baile,danser,danza,ballare,dancar,dansen,taniec,танцы,zumba' },
    { k: 'row', met: 7.0, min: 30, a: 'rowing,rudern,kurek,remo,aviron,canottaggio,roeien,wioslarstwo,elliptical,crosstrainer,cross trainer,stairmaster,stepper,stairs,treppen,merdiven' },
    { k: 'ski', met: 6.0, min: 120, a: 'ski,skiing,skifahren,kayak,esqui,climbing,klettern,bouldern,tirmanis,escalada,skating,inline skating,schlittschuh,paten' },
    { k: 'chores', met: 3.3, min: 60, a: 'cleaning,housework,putzen,hausarbeit,temizlik,limpieza,menage,pulizie,limpeza,schoonmaken,sprzatanie,уборка,gardening,gartenarbeit,bahce,jardineria,jardinage,giardinaggio,moving boxes,umzug' },
    { k: 'feet', met: 2.3, min: 300, a: 'on my feet all day,standing all day,physical job,den ganzen tag auf den beinen,ganztags auf den beinen,butun gun ayakta,todo el dia de pie,debout toute la journee,in piedi tutto il giorno,em pe o dia todo,de hele dag op de been' }
  ];

  const WORDNUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5, couple: 2, few: 3, some: 1,
    ein: 1, eine: 1, einen: 1, einem: 1, einer: 1, zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6, halb: 0.5, halbe: 0.5, halben: 0.5, paar: 2,
    bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, yarim: 0.5, birkac: 3,
    un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, medio: 0.5, media: 0.5, une: 1, deux: 2, trois: 3, quatre: 4, demi: 0.5, demie: 0.5,
    due: 2, tre: 3, quattro: 4, mezzo: 0.5, mezza: 0.5, um: 1, uma: 1, dois: 2, duas: 2, meio: 0.5, meia: 0.5, een: 1, twee: 2, drie: 3, vier_nl: 4, halve: 0.5,
    jeden: 1, jedna: 1, dwa: 2, dwie: 2, trzy: 3, pol: 0.5 };

  // unit words -> [unit id]
  const UNITS = [
    ['kg', /^(kg|kilo|kilos|kilogramm?)$/], ['g', /^(g|gr|grams?|gramm|gram|gramos|grammes?|grammi|gramas|gramy)$/],
    ['l', /^(l|liters?|litres?|liter|litre|litro|litros|litri|litry|litr)$/], ['ml', /^(ml|milliliters?|millilitres?)$/], ['cl', /^cl$/], ['dl', /^dl$/],
    ['slice', /^(slices?|scheiben?|dilim|rebanadas?|tranches?|fette|fetta|fatias?|plakjes?|plasterki|kromka|kromki|ломтик\w*)$/],
    ['cup', /^(cups?|tassen?|fincan|bardak cay|tazas?|tasses?|tazze?|tazza|xicaras?|kopjes?|kubki?|filizank\w*|чашк\w*)$/],
    ['glass', /^(glass|glasses|glas|glaser|bardak|vasos?|verres?|bicchieri?|bicchiere|copos?|glazen?|szklank\w*|стакан\w*)$/],
    ['bowl', /^(bowls?|schussel|schusseln|schale|schalen|kase|kasesi|tazon|bol|bols|ciotola|ciotole|tigela|kom|kommen|miska|miski|тарелк\w*|миск\w*)$/],
    ['plate', /^(plates?|teller|tabak|plato|platos|assiette|assiettes|piatto|piatti|prato|pratos|bord|borden|talerz\w*)$/],
    ['can', /^(cans?|dosen?|kutu|latas?|canettes?|lattin\w*|blikjes?|puszk\w*|банк\w*)$/],
    ['bottle', /^(bottles?|flaschen?|sise|botellas?|bouteilles?|bottiglie?|bottiglia|garrafas?|flessen|fles|butelk\w*|бутылк\w*)$/],
    ['tbsp', /^(tbsp|tablespoons?|el|essloffel|essloeffel|yemek kasigi|cucharadas?|cuilleres? a soupe|cucchiai[o]?|colheres? de sopa|eetlepels?|lyzk\w*)$/],
    ['tsp', /^(tsp|teaspoons?|tl|teeloffel|tatli kasigi|cay kasigi|cucharaditas?|cuilleres? a cafe|cucchiaini?|colheres? de cha|theelepels?|lyzeczk\w*)$/],
    ['handful', /^(handfuls?|handvoll|avuc|punados?|poignees?|manciat\w*|punhados?|handjes?|garsc\w*)$/],
    ['scoop', /^(scoops?|kugeln?|messloffel|olcek|top|cucharon|boules?|palline?|bolas?|bolletjes?|galk\w*)$/],
    ['shot', /^(shots?|kurze|kurzer)$/],
    ['tafel', /^(tafel|tafeln|tablets?)$/],
    ['piece', /^(pieces?|pcs|stuck|stueck|stk|adet|tane|parca|piezas?|morceaux?|pezzi|pezzo|pedacos?|unidades?|stuks?|kawalk\w*|sztuk\w*|шт\w*)$/],
    ['bar', /^(bars?|riegel|bar)$/]
  ];
  const UNIT_G = { tafel: 100, cup: 240, glass: 250, bowl: 300, plate: 350, can: 330, bottle: 500, tbsp: 15, tsp: 5, handful: 30, scoop: 30, shot: 40 };
  const BIG = /\b(big|large|huge|xl|gross|grosse|grossen|grosser|riesig|buyuk|kocaman|grande|grandes|gros|grosse|groot|grote|duz\w*|duzy|большой|double|doppelt|doppelte|cift)\b/;
  const SMALL = /\b(small|little|mini|klein|kleine|kleinen|kleiner|kucuk|pequeno|pequena|petit|petite|piccolo|piccola|klein|maly|mala|маленьк\w*)\b/;

  const norm = s => String(s).toLowerCase().replace(/ı/g, 'i').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`´]/g, ' ').replace(/\s+/g, ' ').trim();

  // index aliases, longest first
  function index(list) {
    const out = [];
    list.forEach(item => item.a.split(',').forEach(al => { al = norm(al); if (al) out.push([al, item]); }));
    return out.sort((x, y) => y[0].length - x[0].length);
  }
  const FIDX = index(F), AIDX = index(ACT);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RX = new Map();
  function aliasRx(al) {
    if (!RX.has(al)) RX.set(al, new RegExp('(^|[^\\p{L}])' + esc(al) + '(s|es|n|en|e|er|ler|lar|i|u|si|su|ni|nu|y|ов|ы|и)?(?=$|[^\\p{L}])', 'u'));
    return RX.get(al);
  }
  // find non-overlapping matches in text
  function findAll(text, idx) {
    const used = new Array(text.length).fill(false), hits = [];
    for (const [al, item] of idx) {
      const m = aliasRx(al).exec(text); if (!m) continue;
      const start = m.index + m[1].length, end = start + al.length + (m[2] ? m[2].length : 0);
      let clash = false; for (let i = start; i < end; i++) if (used[i]) { clash = true; break; }
      if (clash) continue;
      for (let i = start; i < end; i++) used[i] = true;
      if (!hits.some(h => h.item === item)) hits.push({ item, start, end });
    }
    return hits.sort((a, b) => a.start - b.start);
  }

  function parseNumber(tok) {
    if (tok == null) return null;
    tok = tok.replace(',', '.');
    if (/^\d+\/\d+$/.test(tok)) { const [a, b] = tok.split('/'); return +b ? +a / +b : null; }
    if (/^\d*\.?\d+$/.test(tok)) return +tok;
    if (tok === '½') return 0.5; if (tok === '¼') return 0.25; if (tok === '¾') return 0.75;
    return WORDNUM[tok] != null ? WORDNUM[tok] : null;
  }

  // split food text into segments
  function segments(text) {
    return String(text || '')
      .replace(/^\s*[\p{L} ]{2,20}:\s*/gmu, '')                       // "Breakfast:" labels
      .split(/[\n;+•·]|,(?!\d)|(?<!\d),|(?:\s(?:and|und|ve|y|et|e|en|i|и|plus|dazu|sowie|also)\s)/u)
      .map(s => s.trim()).filter(s => s.length > 0);
  }

  function round1(x) { return Math.round(x * 10) / 10; }

  function foodItem(item, grams, conf, label) {
    const [p, c, f, fib, sat, sug, alc] = item.n, k = grams / 100;
    return { name: label, amount: '', grams: Math.round(grams), protein_g: round1(p * k), carbs_g: round1(c * k), fat_g: round1(f * k), fiber_g: round1(fib * k),
      alcohol_g: round1(alc * k), free_sugar_g: round1(sug * k), sat_fat_g: round1(sat * k), confidence: conf, _key: item.k };
  }

  // typo-tolerant match for single words ("bannana", "spagetti", "joghurt")
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[b.length];
  }
  const SINGLE = FIDX.filter(([al]) => !al.includes(' ') && al.length >= 4);
  function fuzzy(seg) {
    let best = null;
    seg.split(/[^\p{L}]+/u).filter(w => w.length >= 4).forEach((w, idx, arr) => {
      for (const [al, item] of SINGLE) {
        const lim = al.length >= 8 ? 2 : 1, d = lev(w, al);
        if (d <= lim && (!best || d < best.d)) { const start = seg.indexOf(w); best = { item, start, end: start + w.length, d }; }
      }
    });
    return best ? { item: best.item, start: best.start, end: best.end } : null;
  }
  // words that say more than the matched food ("Milka", "Ülker", "zero", "protein") -> worth an online lookup
  const GENERIC = new Set(('big large small little huge mini xl medium grilled fried boiled baked roasted cooked raw fresh homemade home made organic bio plain natural hot cold warm ' +
    'piece pieces plate bowl glass cup can bottle slice slices portion serving handful scoop bar tablet pack packet box serving my some half whole ' +
    'gross grosse grossen grosser klein kleine kleinen gebraten gekocht gegrillt frisch selbstgemacht hausgemacht portion stuck teller schussel glas tasse dose flasche scheibe scheiben tafel packung riegel ' +
    'buyuk kucuk kizarmis haslanmis firinda izgara taze ev yapimi porsiyon tabak bardak kase dilim paket adet tane ' +
    'grande pequeno frito cocido asado casero plato vaso taza lata botella rebanada petit gros cuit maison assiette verre tasse ' +
    'breakfast lunch dinner snack fruhstuck mittag mittagessen abend abendessen abends morgens kahvalti ogle aksam ara ogun desayuno almuerzo cena').split(' '));
  // brand names that the table maps to a generic food; their real label values are better
  const BRANDS = new Set('snickers mars twix kitkat bounty kinder oreo haribo nutella milka ritter monster redbull coca cola coke pepsi fanta sprite whopper subway nocilla ulker albeni lindt toblerone pringles doritos lays chio activia danone alpro ehrmann muller mueller barilla nesquik nescafe starbucks skittles mms'.split(' '));
  function extraWords(seg, hits) {
    const brands = seg.split(/[^\p{L}]+/u).filter(w => BRANDS.has(w) || (w === 'red' && /red bull/.test(seg)));
    let rest = seg;
    hits.forEach(h => { rest = rest.slice(0, h.start) + ' '.repeat(h.end - h.start) + rest.slice(h.end); });
    const words = foodWords(rest).split(' ').filter(w => w.length >= 3 && !GENERIC.has(w) && !STOPW.has(w) && !known(w) && !brands.includes(w));
    return [...new Set(brands.map(b => b === 'red' ? 'red bull' : b).concat(words))].join(' ').replace('red bull bull', 'red bull');
  }
  let VOCAB = null;
  function known(w) {
    if (!VOCAB) { VOCAB = new Set(); FIDX.forEach(([al]) => al.split(' ').forEach(x => x.length >= 3 && VOCAB.add(x))); }
    if (VOCAB.has(w) || VOCAB.has(w.replace(/(es|s|n|en|e|er|ler|lar|i)$/, ''))) return true;
    if (w.length >= 5) for (const v of VOCAB) if (v.length >= 5 && lev(w, v) <= (w.length >= 8 ? 2 : 1)) return true;
    return false;
  }
  function cleanQuery(segRaw) { return foodWords(segRaw).split(' ').filter(w => w && !GENERIC.has(w) && !STOPW.has(w)).join(' '); }
  const STOPW = new Set('and with mit und ile ve con avec com met plus dazu oder or the der die das ein eine bir'.split(' '));

  function parseFoods(text, notes, segsOut) {
    const foods = [];
    for (const segRaw of segments(text)) {
      const seg = norm(segRaw);
      const rec = { raw: segRaw.trim(), items: [], unknown: false, extra: '', barcode: (segRaw.match(/\b\d{8,14}\b/) || [])[0] || '' };
      if (segsOut) segsOut.push(rec);
      // user-given calories: "snack 250 kcal"
      const kc = seg.match(/(\d+(?:[.,]\d+)?)\s*(kcal|cal|calories|kalorien|kalori|calorias|калори\w*)\b/);
      if (kc) {
        const kcal = parseFloat(kc[1].replace(',', '.'));
        foods.push({ name: segRaw, amount: Math.round(kcal) + ' kcal', grams: 0, protein_g: round1(kcal * 0.15 / 4), carbs_g: round1(kcal * 0.5 / 4), fat_g: round1(kcal * 0.35 / 9),
          fiber_g: 0, alcohol_g: 0, free_sugar_g: 0, sat_fat_g: round1(kcal * 0.12 / 9), confidence: 'high' });
        notes.push(['a_custom', { x: segRaw, n: Math.round(kcal) }]);
        rec.items.push(foods[foods.length - 1]); rec.fixed = true;
        continue;
      }
      let hits = findAll(seg, FIDX);
      hits = hits.filter((h, i) => !(h.item.k === 'cheese' && seg.slice(h.start, h.end) === 'kase' && i + 1 < hits.length));
      if (!hits.length) { const fz = fuzzy(seg); if (fz) hits = [fz]; }
      if (!hits.length) { rec.unknown = true; notes.push(['a_unknown', { x: segRaw }]); continue; }
      rec.extra = extraWords(seg, hits);
      hits.forEach((h, i) => {
        const item = h.item, before = seg.slice(i ? hits[i - 1].end : 0, h.start), after = seg.slice(h.end, i + 1 < hits.length ? hits[i + 1].start : seg.length);
        const zone = (before + ' ' + (i === 0 ? after : '')).trim();
        let grams = null, conf = 'medium', amount = '';
        // explicit weight/volume: "200 g", "0.5 l", "500ml"
        const wm = zone.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grams?|gramm|gram|ml|cl|dl|l|liter|litre|liters|litres)\b/);
        if (wm) {
          const v = parseFloat(wm[1].replace(',', '.')), u = wm[2];
          grams = u === 'kg' ? v * 1000 : u === 'l' || /^lit/.test(u) ? v * 1000 : u === 'dl' ? v * 100 : u === 'cl' ? v * 10 : v;
          if (item.k === 'beer' || item.k === 'soda' || item.k === 'juice' || item.k === 'milk') grams *= 1.03;
          conf = 'high'; amount = wm[0];
        } else {
          // count + optional unit: "2 slices", "a glass", "3 eggs"
          const words = zone.split(/\s+/).filter(Boolean);
          let qty = null, unit = null;
          for (let j = 0; j < words.length; j++) {
            const n = parseNumber(words[j]); if (n != null && qty == null) { qty = n; continue; }
            for (const [u, rx] of UNITS) if (rx.test(words[j]) || (j + 1 < words.length && rx.test(words[j] + ' ' + words[j + 1]))) { unit = u; break; }
          }
          // "1/2 pizza", "½"
          const frac = zone.match(/(\d+)\s*\/\s*(\d+)/); if (frac && +frac[2]) qty = +frac[1] / +frac[2];
          if (qty == null) qty = 1;
          let per;
          if (unit === 'slice') per = item.sl || item.pc || 30;
          else if (unit === 'piece' || unit === 'bar') per = item.pc || item.por;
          else if (unit && UNIT_G[unit]) {
            per = UNIT_G[unit];
            if (unit === 'glass' && (item.k === 'wine')) per = 150;
            if (unit === 'glass' && (item.k === 'spirits')) per = 40;
            if (unit === 'cup' && (item.k === 'rice' || item.k === 'pasta' || item.k === 'bulgur')) per = 170;
            if (unit === 'cup' && (item.k === 'oats' || item.k === 'muesli' || item.k === 'cereal')) per = 85;
          } else per = item.pc && /\d|^(a|an|ein|eine|einen|bir|un|una|une|uno)\b/.test(zone) ? item.pc : item.por;
          grams = qty * per;
          if (!unit && !/\d/.test(zone) && parseNumber(words[0]) == null) conf = 'low';
          amount = (qty !== 1 || unit ? String(Math.round(qty * 100) / 100) : '') + (unit ? ' × ' + unit : '');
        }
        if (BIG.test(zone)) { grams *= 1.4; }
        if (SMALL.test(zone)) { grams *= 0.7; }
        if (i > 0 && !wm && !/\d/.test(before)) { grams *= 0.5; conf = 'low'; }      // side item in "chicken with rice"
        if (conf === 'low' && i === 0) notes.push(['a_default', { x: segRaw.trim(), g: Math.round(grams) }]);
        const label = hits.length > 1 ? segRaw.trim() + ' — ' + item.k : segRaw.trim();
        const fi = foodItem(item, grams, conf, label); fi.amount = amount.trim();
        foods.push(fi); rec.items.push(fi); (rec.keys = rec.keys || []).push(item.k);
      });
    }
    return foods;
  }

  function parseActivity(text, chips, notes) {
    let raw = String(text || ''), steps = null;
    const t = norm(raw).replace(/(\d)[.,' ](?=\d{3}\b)/g, '$1');
    const sm = t.match(/(\d{3,6})\s*(k\b)?\s*(steps?|schritte?n?|adim|pasos|pas|passi|passos|stappen|krokow|kroki|шаг\w*|крок\w*|خطوة|कदम|步|歩|걸음)/u) ||
               t.match(/(steps?|schritte|adim)\s*:?\s*(\d{3,6})/);
    if (sm) steps = +(sm[1] && /^\d/.test(sm[1]) ? sm[1] : sm[2]);
    const sk = t.match(/(\d+(?:[.,]\d)?)\s*k\s*(steps?|schritte|adim)/); if (sk) steps = Math.round(parseFloat(sk[1].replace(',', '.')) * 1000);
    let strength = false; const acts = [];
    const segs = raw.replace(/(\d)[.,' ](?=\d{3}\b)/g, '$1').split(/[\n;]|,(?!\d)|(?<!\d),|(?:\s(?:and|und|ve|y|et|e|en|i|и|plus|dann|then|danach)\s)/u).map(s => s.trim()).filter(Boolean);
    const chipItems = (chips || []).map(([ph, key]) => Object.assign({}, ACT.find(x => x.k === key) || { k: key, met: 0, min: 0 }, { a: ph.replace(/,/g, ' ') }));
    const idx = chipItems.length ? index(chipItems).concat(AIDX).sort((x, y) => y[0].length - x[0].length) : AIDX;
    for (const segRaw of segs) {
      const seg = norm(segRaw);
      const hits = findAll(seg, idx); if (!hits.length) continue;
      const h = hits[0], item = h.item;
      if (item.k === 'steps' || item.k === 'desk') continue;
      if (item.k === 'walk' && steps) continue;                    // walking is covered by the step count
      let min = null;
      const hm = seg.match(/(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|hours?|std|stunden?|stunde|saat|horas?|heures?|ore|ora|uur|godz\w*|час\w*)\b/);
      const mm = seg.match(/(\d+(?:[.,]\d+)?)\s*(m|min|mins|minutes?|minuten|dakika|dk|minutos|minuti|minuty|минут\w*)\b/);
      const km = seg.match(/(\d+(?:[.,]\d+)?)\s*(km|kilometers?|kilometres?|kilometer)\b/);
      if (hm) min = parseFloat(hm[1].replace(',', '.')) * 60 + (mm && mm.index > hm.index ? parseFloat(mm[1]) : 0);
      else if (mm) min = parseFloat(mm[1].replace(',', '.'));
      else if (km && item.kmh) min = parseFloat(km[1].replace(',', '.')) / item.kmh * 60;
      if (min == null) { min = item.min; notes.push(['a_mins', { x: segRaw, m: min }]); }
      let met = item.met;
      if (/\b(intense|intensive|hard|schnell|fast|heavy|vigorous|hizli|agir|intenso|rapide|veloce|rapido|snel|szybk\w*)\b/.test(seg)) met *= 1.25;
      if (/\b(easy|light|leicht|locker|slow|hafif|yavas|suave|ligero|leger|lento|rustig|wolno)\b/.test(seg)) met *= 0.8;
      if (item.strength) strength = true;
      acts.push({ name: segRaw, detail: '', met: Math.round(met * 10) / 10, minutes: Math.round(min) });
    }
    return { steps, activities: acts, strength_training: strength };
  }

  // feedback (all texts come from the page's translations via tr(key, vars))
  function feedback(r, ctx, tr) {
    const ATW = { p: 4, c: 4, f: 9, fib: 2, a: 7 };
    const T = { p: 0, c: 0, f: 0, fib: 0, a: 0, sug: 0, kcal: 0 }; const keys = new Set();
    r.foods.forEach(x => { T.p += x.protein_g; T.c += x.carbs_g; T.f += x.fat_g; T.fib += x.fiber_g; T.a += x.alcohol_g; T.sug += x.free_sugar_g; if (x._key) keys.add(x._key); });
    T.kcal = T.p * ATW.p + T.c * ATW.c + T.f * ATW.f + T.fib * ATW.fib + T.a * ATW.a;
    const w = ctx.w || 70, stepsN = r.steps || 0;
    const actK = (stepsN || 5000) * 0.04 * w / 70 + r.activities.reduce((s, a) => s + Math.max(0, a.met - 1) * w * a.minutes / 60, 0);
    const out = (ctx.b || 1600) + T.kcal * 0.1 + actK, bal = T.kcal - out;
    const pT = Math.round(w * (ctx.goal === 'lose fat' ? 2.0 : ctx.goal === 'build muscle' ? 1.6 : 1.4));
    const ref = Math.max(out, 1200), fibT = Math.round(ref / 1000 * 14), sugMax = Math.round(ref * 0.10 / 4);
    const good = [], improve = [], tomorrow = []; let score = 70;
    let summary;
    if (T.kcal < 1200 && T.kcal > 0) { summary = tr('lf_sum_low', { n: Math.round(T.kcal), b: ctx.b }); score -= 25; }
    else if (ctx.goal === 'lose fat') { if (bal < -150) { summary = tr('lf_sum_lose_ok'); score += 10; } else { summary = tr('lf_sum_lose_bad'); score -= 15; } }
    else if (ctx.goal === 'build muscle') { if (bal > -100 && bal < 600) { summary = tr('lf_sum_build_ok'); score += 10; } else if (bal <= -100) { summary = tr('lf_sum_build_low'); score -= 10; } else { summary = tr('lf_sum_build_high'); score -= 5; } }
    else { if (Math.abs(bal) < 300) { summary = tr('lf_sum_maint_ok'); score += 10; } else { summary = tr('lf_sum_maint_off'); score -= 10; } }
    if (T.p >= pT * 0.9) { good.push(tr('lf_prot_ok', { p: Math.round(T.p), t: pT })); score += 8; }
    else { improve.push(tr('lf_prot_low', { p: Math.round(T.p), t: pT })); tomorrow.push(tr('lf_tm_prot', { n: Math.round(pT / 4) })); score -= 10; }
    if (T.fib >= fibT * 0.8) { good.push(tr('lf_fib_ok', { n: Math.round(T.fib) })); score += 5; }
    else { improve.push(tr('lf_fib_low', { n: Math.round(T.fib), t: fibT })); tomorrow.push(tr('lf_tm_veg')); score -= 6; }
    if (T.sug > sugMax) { improve.push(tr('lf_sug_high', { n: Math.round(T.sug), t: sugMax })); tomorrow.push(tr('lf_tm_water')); score -= 8; }
    else good.push(tr('lf_sug_ok', { t: sugMax }));
    if (T.a > 0) { improve.push(tr('lf_alc', { n: Math.round(T.a) })); score -= Math.min(15, T.a / 3); }
    if (stepsN >= 8000) { good.push(tr('lf_steps_ok', { n: stepsN.toLocaleString() })); score += 5; }
    else if (!r.activities.length) { improve.push(tr('lf_steps_low')); tomorrow.push(tr('lf_tm_walk')); score -= 5; }
    if (r.strength_training) good.push(tr('lf_train_ok'));
    else if (ctx.goal !== 'maintain') tomorrow.push(tr('lf_train_add'));
    if (!tomorrow.length) tomorrow.push(tr('lf_tm_keep'));
    return { score: Math.max(5, Math.min(98, Math.round(score))), summary, good: good.slice(0, 3), improve: improve.slice(0, 3), tomorrow: tomorrow.slice(0, 3) };
  }

  /* analyze(foodText, actText, ctx, tr, chips) -> result object compatible with the AI JSON */
  function analyze(foodText, actText, ctx, tr, chips) {
    const notes = [];
    const segs = [];
    const foods = parseFoods(foodText, notes, segs);
    const act = parseActivity(actText, chips || [], notes);
    const r = { foods, steps: act.steps, activities: act.activities, strength_training: act.strength_training, local: true };
    r.feedback = feedback(r, ctx, tr);
    const defs = notes.filter(n => n[0] === 'a_default').map(n => n[1].x);
    r.assumptions = [tr('lf_a_local')];
    if (defs.length) r.assumptions.push(tr('lf_a_default', { x: defs.join(', ') }));
    notes.filter(n => n[0] !== 'a_default').forEach(([k, v]) => r.assumptions.push(tr(k === 'a_unknown' ? 'lf_a_unknown' : k === 'a_mins' ? 'lf_a_mins' : 'lf_a_custom', v)));
    r.unmatched = notes.filter(n => n[0] === 'a_unknown').length;
    r._unknown = notes.filter(n => n[0] === 'a_unknown').map(n => n[1].x);
    r._segs = segs;
    foods.forEach(f => delete f._key);
    return r;
  }
  // helpers for the on-device AI: look up one food / activity by (English) name
  function lookup(name, grams) { const h = findAll(norm(name), FIDX)[0]; return h ? foodItem(h.item, grams, 'medium', name) : null; }
  function custom(name, grams, n) { return foodItem({ k: '', n: [n.p, n.c, n.f, n.fib, n.sat, n.sug, n.alc].map(x => Math.max(0, +x || 0)) }, grams, 'low', name); }
  function lookupAct(name) { const h = findAll(norm(name), AIDX)[0]; return h ? h.item : null; }
  // amount in a free-text segment: explicit grams/ml, else a count (number or word)
  function amount(segRaw) {
    const seg = norm(segRaw);
    const wm = seg.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grams?|gramm|gram|ml|cl|dl|l|liter|litre|liters|litres)\b/);
    if (wm) { const v = parseFloat(wm[1].replace(',', '.')), u = wm[2]; return { grams: u === 'kg' ? v * 1000 : u === 'l' || /^lit/.test(u) ? v * 1000 : u === 'dl' ? v * 100 : u === 'cl' ? v * 10 : v, qty: 1, text: wm[0] }; }
    const w = seg.split(/\s+/); let qty = null;
    for (const x of w) { const n = parseNumber(x); if (n != null) { qty = n; break; } }
    const frac = seg.match(/(\d+)\s*\/\s*(\d+)/); if (frac && +frac[2]) qty = +frac[1] / +frac[2];
    return { grams: null, qty: qty == null ? 1 : qty, given: qty != null };
  }
  // the food words of a segment, without amounts and units (for online search)
  function foodWords(segRaw) {
    return norm(segRaw).replace(/\d+([.,\/]\d+)?\s*(kg|g|gr|grams?|gramm|ml|cl|dl|l|kcal)?\b/g, ' ').split(/\s+/)
      .filter(x => x && WORDNUM[x] == null && !UNITS.some(([, rx]) => rx.test(x)) && !/^(of|von|de|di|du|des|der|die|das|the|a|an|mit|with|ile)$/.test(x)).join(' ').trim();
  }
  function aliasesOf(key) { const it = F.find(x => x.k === key); return it ? [...new Set(it.a.split(',').flatMap(a => norm(a).split(' ')).filter(w => w.length >= 4))] : []; }
  window.FuelLocal = { analyze, feedback, lookup, custom, lookupAct, amount, foodWords, cleanQuery, aliasesOf, _parseFoods: parseFoods, _parseActivity: parseActivity, _norm: norm };
})();
