import type { ShipDefinition } from '../types.js';

// 1:1 aus dem HTML-Prototyp uebernommen (inkl. aller Balance-Anpassungen: Maxima, skalierte
// Werte/Kosten/Bauzeiten fuer die Performance-Kompression, siehe Chat-Verlauf / README).
export const SHIPS: ShipDefinition[] = 
[
  { id:"leicht", name:"Leichter Jäger", img:"ships/leichter_jaeger.png", lore:"Der Leichte Jäger war das erste Schiff, das die Werften am Fließband produzierten – schnell gebaut, schnell verschlissen. Piloten nennen ihn respektlos die 'Blechdose', doch in Schwärmen zu Hunderten wird aus der Blechdose eine Wand aus Stahl.", tier:1, buildTime:4,
    cost:{metall:90000, kristall:30000, deuterium:0}, stats:{waffen:1500, schild:300, panzerung:120000} },
  { id:"schwer", name:"Schwerer Jäger", img:"ships/schwerer_jaeger.png", lore:"Als Antwort auf die hohen Verlustzahlen des Leichten Jägers entwickelt, trägt der Schwere Jäger zusätzliche Panzerplatten direkt über dem Cockpit. Erfahrene Piloten bevorzugen ihn, weil er einen Treffer mehr verzeiht, bevor es ernst wird.", tier:2, buildTime:18,
    cost:{metall:144000, kristall:96000, deuterium:0}, stats:{waffen:3600, schild:600, panzerung:240000} },
  { id:"kreuzer", name:"Kreuzer", img:"ships/kreuzer.png", lore:"Der Kreuzer war ursprünglich als Handelsschiff für die äußeren Kolonien gedacht, bis die ersten Piratenüberfälle eine bewaffnete Variante erzwangen. Aus dem Frachter wurde ein vielseitiger Kampfträger, der bis heute das Rückgrat vieler Flotten bildet.", tier:3, buildTime:32,
    cost:{metall:360000, kristall:126000, deuterium:36000}, stats:{waffen:7200, schild:900, panzerung:486000} },
  { id:"schlachtschiff", name:"Schlachtschiff", img:"ships/schlachtschiff.png", lore:"Schwerfällig, laut und beeindruckend – das Schlachtschiff wurde gebaut, um Angst einzuflößen, bevor auch nur ein Schuss fällt. Manche Kommandanten schicken es allein voraus, nur damit der Gegner sich zweimal überlegt anzugreifen.", tier:4, buildTime:60,
    cost:{metall:630000, kristall:210000, deuterium:0}, stats:{waffen:14000, schild:2800, panzerung:840000} },
  { id:"bomber", name:"Bomber", img:"ships/bomber.png", lore:"Der Bomber wurde nach der Schlacht von Sektor P9 entworfen, als klar wurde, dass befestigte Stellungen mit herkömmlichen Schiffen kaum zu knacken waren. Seine schweren Ladungen sind auf Bunker und Verteidigungsanlagen ausgelegt, nicht auf Duelle zwischen Jägern.", tier:4.5, buildTime:74,
    cost:{metall:600000, kristall:300000, deuterium:180000}, stats:{waffen:12000, schild:6000, panzerung:900000} },
  { id:"schlachtkreuzer", name:"Schlachtkreuzer", img:"ships/schlachtkreuzer.png", lore:"Der Schlachtkreuzer vereint die Feuerkraft eines Schlachtschiffs mit der Wendigkeit eines Kreuzers – ein Kompromiss, der auf dem Papier unmöglich schien. Die Ingenieure, die ihn entwarfen, mussten drei Prototypen opfern, bevor die Balance stimmte.", tier:5, buildTime:88,
    cost:{metall:300000, kristall:400000, deuterium:150000}, stats:{waffen:7000, schild:4000, panzerung:700000} },
  { id:"zerstoerer", name:"Zerstörer", img:"ships/zerstoerer.jpg", lore:"Benannt nach den Kriegsschiffen alter Erdflotten, ist der Zerstörer für nichts anderes gebaut als das Vernichten feindlicher Kapitalschiffe. Sein charakteristisches Dröhnen beim Start ist auf Funkfrequenzen ganzer Sektoren zu hören.", tier:6, buildTime:116,
    cost:{metall:480000, kristall:400000, deuterium:120000}, stats:{waffen:16000, schild:4000, panzerung:880000} },
  { id:"reaper", name:"Reaper", img:"ships/reaper.jpg", lore:"Der Reaper gilt als Krönung konventioneller Schiffstechnik, bevor experimentelle Antriebe wie beim Sandronator Einzug hielten. Seine Silhouette allein reicht in vielen Sektoren aus, um Piratenflotten zum Rückzug zu bewegen.", tier:7, buildTime:144,
    cost:{metall:510000, kristall:330000, deuterium:120000}, stats:{waffen:16800, schild:4200, panzerung:840000} },
  { id:"sandronator", name:"Sandronator", img:"ships/sandronator.png", lore:"Der Sandronator entstand aus einem geheimen Forschungsprogramm und existiert nur als Einzelstück – niemand konnte die instabilen Antriebskerne je in Serie fertigen. Wer ihn fliegt, führt ein Schiff, das eigentlich nicht hätte funktionieren dürfen.", tier:5.5, buildTime:3000, unique:true,
    cost:{metall:300000, kristall:250000, deuterium:100000}, stats:{waffen:1750, schild:550, panzerung:105000} },
  { id:"mining", name:"Mining-Schiff", img:"ships/mining.png", lore:"Unscheinbar und unbewaffnet, ist das Mining-Schiff dennoch das wirtschaftliche Rückgrat jeder Expedition. Ohne seine tägliche Ausbeute an Metall und Kristall bliebe jede Werft und jedes Labor stumm und leer.", tier:0, buildTime:10,
    cost:{metall:8500, kristall:5000, deuterium:1500}, stats:{waffen:0, schild:2200, panzerung:50500},
    miningPerHour:2500 },
  { id:"begleitschiff", name:"Begleitschiff", img:"ships/begleitschiff.png", lore:"Das Begleitschiff wurde entwickelt, um Mining-Flotten auf ihren Routen zu eskortieren, nachdem Piratenüberfälle auf unbewaffnete Erntetrupps zur Regel wurden. Es kämpft selten allein, sondern immer im Schatten der Schiffe, die es beschützt.", tier:0.5, buildTime:6.67,
    cost:{metall:15000, kristall:6000, deuterium:2000}, stats:{waffen:350, schild:60, panzerung:8500} },
  { id:"imperator", name:"Imperator", img:"ships/imperator.jpg", lore:"Der Imperator ist keine Werftproduktion, sondern ein Mythos, der nur aus geborgenen Spezialteilen zusammengesetzt werden kann. Gerüchten zufolge stammen die Baupläne von einer Zivilisation, die es längst nicht mehr gibt.", tier:99, buildTime:86400, maxCount:2,
    specialOnly:true, teileCost:{waffen:1000, schild:1000, panzerung:1000},
    stats:{waffen:40000, schild:10000, panzerung:400000} }
];
