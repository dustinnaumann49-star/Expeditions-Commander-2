import type { ShipDefinition } from '../types.js';

// 1:1 aus dem HTML-Prototyp uebernommen (inkl. aller Balance-Anpassungen: Maxima, skalierte
// Werte/Kosten/Bauzeiten fuer die Performance-Kompression, siehe Chat-Verlauf / README).
// speed/fuelConsumption (fuer die Galaxie-Ansicht, siehe game/galaxy.ts): bei Schiffen mit
// direktem OGame-Pendant an die dortigen Basis-Geschwindigkeiten angelehnt (Leichter Jaeger,
// Schwerer Jaeger, Kreuzer, Schlachtschiff, Bomber, Schlachtkreuzer, Zerstoerer, Reaper).
// Eigene Schiffe ohne OGame-Vorbild (Sandronator, Mining-Schiff, Begleitschiff, Imperator,
// Salvenschiffe) wurden sinngemaess an die naechstliegende OGame-Klasse angepasst (z.B.
// Mining-Schiff wie ein Grosser Transporter, Imperator so extrem langsam wie der Todesstern).
export const SHIPS: ShipDefinition[] = 
[
  { id:"leicht", name:"Leichter Jäger", img:"ships/leichter_jaeger.png", lore:"Der Leichte Jäger war das erste Schiff, das die Werften am Fließband produzierten – schnell gebaut, schnell verschlissen. Piloten nennen ihn respektlos die 'Blechdose', doch in Schwärmen zu Hunderten wird aus der Blechdose eine Wand aus Stahl.", tier:1, buildTime:4,
    cost:{metall:90000, kristall:30000, deuterium:0}, stats:{waffen:1500, schild:300, panzerung:120000}, speed:12500, fuelConsumption:3, driveType:"rakete" },
  { id:"schwer", name:"Schwerer Jäger", img:"ships/schwerer_jaeger.png", lore:"Als Antwort auf die hohen Verlustzahlen des Leichten Jägers entwickelt, trägt der Schwere Jäger zusätzliche Panzerplatten direkt über dem Cockpit. Erfahrene Piloten bevorzugen ihn, weil er einen Treffer mehr verzeiht, bevor es ernst wird.", tier:2, buildTime:18,
    cost:{metall:144000, kristall:96000, deuterium:0}, stats:{waffen:3600, schild:600, panzerung:240000}, speed:10000, fuelConsumption:5, driveType:"rakete" },
  { id:"kreuzer", name:"Kreuzer", img:"ships/kreuzer.png", lore:"Der Kreuzer war ursprünglich als Handelsschiff für die äußeren Kolonien gedacht, bis die ersten Piratenüberfälle eine bewaffnete Variante erzwangen. Aus dem Frachter wurde ein vielseitiger Kampfträger, der bis heute das Rückgrat vieler Flotten bildet.", tier:3, buildTime:32,
    cost:{metall:360000, kristall:126000, deuterium:36000}, stats:{waffen:7200, schild:900, panzerung:486000}, speed:15000, fuelConsumption:8, driveType:"impuls" },
  { id:"schlachtschiff", name:"Schlachtschiff", img:"ships/schlachtschiff.png", lore:"Schwerfällig, laut und beeindruckend – das Schlachtschiff wurde gebaut, um Angst einzuflößen, bevor auch nur ein Schuss fällt. Manche Kommandanten schicken es allein voraus, nur damit der Gegner sich zweimal überlegt anzugreifen.", tier:4, buildTime:60,
    cost:{metall:630000, kristall:210000, deuterium:0}, stats:{waffen:14000, schild:2800, panzerung:840000}, speed:10000, fuelConsumption:15, driveType:"impuls" },
  { id:"bomber", name:"Bomber", img:"ships/bomber.png", lore:"Der Bomber wurde nach der Schlacht von Sektor P9 entworfen, als klar wurde, dass befestigte Stellungen mit herkömmlichen Schiffen kaum zu knacken waren. Seine schweren Ladungen sind auf Bunker und Verteidigungsanlagen ausgelegt, nicht auf Duelle zwischen Jägern.", tier:4.5, buildTime:74,
    cost:{metall:600000, kristall:300000, deuterium:180000}, stats:{waffen:12000, schild:6000, panzerung:900000}, speed:4000, fuelConsumption:14, driveType:"impuls" },
  { id:"schlachtkreuzer", name:"Schlachtkreuzer", img:"ships/schlachtkreuzer.png", lore:"Der Schlachtkreuzer vereint die Feuerkraft eines Schlachtschiffs mit der Wendigkeit eines Kreuzers – ein Kompromiss, der auf dem Papier unmöglich schien. Die Ingenieure, die ihn entwarfen, mussten drei Prototypen opfern, bevor die Balance stimmte.", tier:5, buildTime:88,
    cost:{metall:300000, kristall:400000, deuterium:150000}, stats:{waffen:7000, schild:4000, panzerung:700000}, speed:10000, fuelConsumption:12, driveType:"hyperraum" },
  { id:"zerstoerer", name:"Zerstörer", img:"ships/zerstoerer.jpg", lore:"Benannt nach den Kriegsschiffen alter Erdflotten, ist der Zerstörer für nichts anderes gebaut als das Vernichten feindlicher Kapitalschiffe. Sein charakteristisches Dröhnen beim Start ist auf Funkfrequenzen ganzer Sektoren zu hören.", tier:6, buildTime:116,
    cost:{metall:480000, kristall:400000, deuterium:120000}, stats:{waffen:16000, schild:4000, panzerung:880000}, speed:5000, fuelConsumption:16, driveType:"hyperraum" },
  { id:"reaper", name:"Reaper", img:"ships/reaper.jpg", lore:"Der Reaper gilt als Krönung konventioneller Schiffstechnik, bevor experimentelle Antriebe wie beim Sandronator Einzug hielten. Seine Silhouette allein reicht in vielen Sektoren aus, um Piratenflotten zum Rückzug zu bewegen.", tier:7, buildTime:144,
    cost:{metall:510000, kristall:330000, deuterium:120000}, stats:{waffen:16800, schild:4200, panzerung:840000}, speed:7000, fuelConsumption:15, driveType:"hyperraum" },
  { id:"sandronator", name:"Sandronator", img:"ships/sandronator.png", lore:"Der Sandronator entstand aus einem geheimen Forschungsprogramm und existiert nur als Einzelstück – niemand konnte die instabilen Antriebskerne je in Serie fertigen. Wer ihn fliegt, führt ein Schiff, das eigentlich nicht hätte funktionieren dürfen.", tier:5.5, buildTime:3000, unique:true,
    cost:{metall:300000, kristall:250000, deuterium:100000}, stats:{waffen:1750, schild:550, panzerung:105000}, speed:2000, fuelConsumption:20, driveType:"hyperraum" },
  { id:"mining", name:"Mining-Schiff", img:"ships/mining.png", lore:"Unscheinbar und unbewaffnet, ist das Mining-Schiff dennoch das wirtschaftliche Rückgrat jeder Expedition. Ohne seine tägliche Ausbeute an Metall und Kristall bliebe jede Werft und jedes Labor stumm und leer.", tier:0, buildTime:10,
    cost:{metall:8500, kristall:5000, deuterium:1500}, stats:{waffen:0, schild:2200, panzerung:50500}, speed:7500, fuelConsumption:6, driveType:"rakete" },
  { id:"begleitschiff", name:"Begleitschiff", img:"ships/begleitschiff.png", lore:"Das Begleitschiff wurde entwickelt, um Mining-Flotten auf ihren Routen zu eskortieren, nachdem Piratenüberfälle auf unbewaffnete Erntetrupps zur Regel wurden. Es kämpft selten allein, sondern immer im Schatten der Schiffe, die es beschützt.", tier:0.5, buildTime:6.67,
    cost:{metall:15000, kristall:6000, deuterium:2000}, stats:{waffen:350, schild:60, panzerung:8500}, speed:12000, fuelConsumption:4, driveType:"rakete" },
  { id:"imperator", name:"Imperator", img:"ships/imperator.jpg", lore:"Der Imperator ist keine Werftproduktion, sondern ein Mythos, der nur aus geborgenen Spezialteilen zusammengesetzt werden kann. Gerüchten zufolge stammen die Baupläne von einer Zivilisation, die es längst nicht mehr gibt.", tier:99, buildTime:86400, maxCount:2,
    specialOnly:true, teileCost:{waffen:1000, schild:1000, panzerung:1000},
    stats:{waffen:50400, schild:12600, panzerung:2520000}, speed:100, fuelConsumption:40, driveType:"hyperraum" },
  { id:"salvenjaeger", name:"Salvenjäger", img:"ships/salvenjaeger.jpg", lore:"Der Salvenjäger trägt ein experimentelles Zielerfassungs-Array, das mehrere schwache Ziele gleichzeitig erfasst, statt sie nacheinander abzuarbeiten. Gegen Schwärme aus Jägern verwandelt sich ein einzelner Treffer in ein ganzes Salvenfeuer.", tier:2.5, buildTime:30, maxCount:60,
    cost:{metall:1600000, kristall:1000000, deuterium:400000}, stats:{waffen:9000, schild:250, panzerung:70000}, speed:12500, fuelConsumption:10, driveType:"rakete" },
  { id:"salvenkreuzer", name:"Salvenkreuzer", img:"ships/salvenkreuzer.jpg", lore:"Der Salvenkreuzer ist die Weiterentwicklung des Salvenjägers für schwerere Ziele. Seine Feuerleitzentrale kann mehrere Kreuzer-Klasse-Schiffe zeitgleich anvisieren und abfeuern, was ganze Formationen binnen Sekunden auseinanderreißt.", tier:3.5, buildTime:60, maxCount:30,
    cost:{metall:4000000, kristall:3000000, deuterium:1400000}, stats:{waffen:32000, schild:1200, panzerung:250000}, speed:10000, fuelConsumption:18, driveType:"impuls" },
  { id:"salvendreadnought", name:"Salvendreadnought", img:"ships/salvendreadnought.jpg", lore:"Der Salvendreadnought gilt als teuerster und seltenster je gebauter Schiffstyp. Seine Existenz wird von den meisten Werften bestritten, doch wer ihn im Gefecht gesehen hat, berichtet, wie er halbe Elite-Flotten in einer einzigen koordinierten Salve zerlegt.", tier:5.5, buildTime:120, maxCount:16,
    cost:{metall:9000000, kristall:7600000, deuterium:4000000}, stats:{waffen:52000, schild:2200, panzerung:500000}, speed:6000, fuelConsumption:25, driveType:"hyperraum" }
];
