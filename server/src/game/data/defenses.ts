import type { DefenseDefinition } from '../types.js';

// 1:1 aus dem HTML-Prototyp uebernommen (inkl. aller Balance-Anpassungen).
export const DEFENSES: DefenseDefinition[] = 
[
  { id:"raketenwerfer", name:"Raketenwerfer", img:"defense/raketenwerfer.jpg", lore:"Der Raketenwerfer ist die älteste und einfachste Verteidigungsanlage – billig, robust und in jeder Kolonie sofort einsatzbereit. Was ihm an Feuerkraft fehlt, macht er durch schiere Stückzahl wett.", buildTime:25.71,
    cost:{metall:50000, kristall:0, deuterium:0}, stats:{waffen:770, schild:10400, panzerung:59000} },
  { id:"leichteslaser", name:"Leichtes Lasergeschütz", img:"defense/leichteslaser.jpg", lore:"Entwickelt als schnelle Antwort auf leichte Jägerschwärme, feuert das Leichte Lasergeschütz präziser als der Raketenwerfer, dafür mit spürbar weniger Wucht pro Treffer.", buildTime:35.45,
    cost:{metall:30000, kristall:10000, deuterium:0}, stats:{waffen:620, schild:8300, panzerung:47000} },
  { id:"schwereslaser", name:"Schweres Lasergeschütz", img:"defense/schwereslaser.jpg", lore:"Das Schwere Lasergeschütz war lange die Standardverteidigung kleinerer Außenposten, bis größere Kaliber wie die Gauß-Kanone verfügbar wurden. Viele Kommandanten schwören trotzdem noch heute auf seine Zuverlässigkeit.", buildTime:64.67,
    cost:{metall:96000, kristall:32000, deuterium:0}, stats:{waffen:1970, schild:26600, panzerung:151000} },
  { id:"gausskanone", name:"Gauß-Kanone", img:"defense/gausskanone.jpg", lore:"Die Gauß-Kanone beschleunigt ihre Geschosse magnetisch auf ein Vielfaches der Schallgeschwindigkeit. Der Bau einer einzigen Kanone verschlingt so viel Kristall wie eine kleine Kreuzer-Staffel.", buildTime:123.11,
    cost:{metall:200000, kristall:150000, deuterium:20000}, stats:{waffen:5690, schild:76800, panzerung:436000} },
  { id:"ionengeschuetz", name:"Ionengeschütz", img:"defense/ionengeschuetz.png", lore:"Statt Materie zu zerfetzen, überlädt das Ionengeschütz gezielt die Schildsysteme feindlicher Schiffe. Es gilt als unauffällig, bis eine gegnerische Flotte plötzlich ungeschützt dasteht.", buildTime:103.63,
    cost:{metall:96000, kristall:240000, deuterium:0}, stats:{waffen:5170, schild:69800, panzerung:395000} },
  { id:"plasmawerfer", name:"Plasmawerfer", img:"defense/plasmawerfer.png", lore:"Der Plasmawerfer ist die stärkste stationäre Waffe, die je in Serie gefertigt wurde – und entsprechend selten, da sein Bau enorme Mengen Deuterium bindet. Basen mit Plasmawerfern gelten als nahezu uneinnehmbar.", buildTime:240,
    cost:{metall:300000, kristall:300000, deuterium:180000}, stats:{waffen:12000, schild:162000, panzerung:918000} },
  { id:"kleineschildkuppel", name:"Kleine Schildkuppel", img:"defense/kleineschildkuppel.png", lore:"Die Kleine Schildkuppel überspannt eine Basis mit einem Energiefeld und verteilt überschüssige Kapazität automatisch an alle anderen Verteidigungsanlagen. Ihre Bauzahl ist bewusst begrenzt, um die Netzstabilität nicht zu gefährden.", buildTime:12.73, maxCount:1, isDome:true,
    cost:{metall:10000, kristall:10000, deuterium:0}, stats:{waffen:0, schild:24000, panzerung:4000} },
  { id:"grosseschildkuppel", name:"Große Schildkuppel", img:"defense/grosseschildkuppel.jpg", lore:"Die Große Schildkuppel ist die ausgereifte Weiterentwicklung ihres kleinen Pendants und kann ganze Sektoren mit einem einzigen Energiefeld abdecken. Ihr Bau gilt in vielen Kolonien als Statussymbol militärischer Stärke.", buildTime:16.36, maxCount:1, isDome:true,
    cost:{metall:50000, kristall:50000, deuterium:0}, stats:{waffen:0, schild:119000, panzerung:21000} },
  // Spezialverteidigung mit Mehrfachziel-Salve (siehe MULTI_TARGET_VOLLEY_SHIPS in
  // combatConstants.ts, dieselbe Faehigkeit wie die Salvenschiffe): bei erfolgreicher
  // Zielerfassung trifft die Anlage EINMAL JEDEN anfaelligen Schiffstyp, der gerade praesent ist,
  // statt nur eine zufaellige Einheit. Bewusst als "Glaskanone" ausgelegt: sehr hoher
  // Waffenschaden, dafuer deutlich weniger Schild/Panzerung als eine gewoehnliche Verteidigung
  // desselben Kostenniveaus (Kosten/Waffenpunkt-Regel aus Punkt 17 wird hier bewusst durchbrochen,
  // analog zu den Salvenschiffen). MUSS aus generateDefenseFleet() ausgeschlossen werden (siehe
  // combat.ts), sonst tauchen sie in generierten Piraten-/Raid-Verteidigungen auf.
  // maxCount (Nutzerentscheidung, explizit als HARTE Grenze gewuenscht, siehe ships.ts fuer
  // dieselbe Regel bei Imperator/Salvenschiffen): Sentinel-Kanone 150, Ultimate-Kanone 60 - bewusst
  // hoeher als bei den Salvenschiffen, da ihre Werte im Vergleich weniger dominant sind.
  { id:"sentinelkanone", name:"Sentinel-Kanone", img:"defense/sentinelkanone.jpg", lore:"Die Sentinel-Kanone koppelt ein experimentelles Mehrfach-Zielerfassungs-Array an ein stationaeres Geschuetz - was bei Schiffen nur gegen wenige Ziele gleichzeitig funktioniert, wird hier mit der ungebremsten Energiezufuhr einer festen Basis kombiniert. Gegen anrueckende Jaegerschwaerme verwandelt sich ein einzelner Treffer in ein ganzes Sperrfeuer.", buildTime:70, maxCount:150,
    cost:{metall:400000, kristall:250000, deuterium:100000}, stats:{waffen:8000, schild:8000, panzerung:60000} },
  { id:"ultimatekanone", name:"Ultimate-Kanone", img:"defense/ultimatekanone.jpg", lore:"Die Ultimate-Kanone gilt als die teuerste stationaere Waffe, die je gebaut wurde - ihr Feuerleitsystem kann gleichzeitig Kreuzer- UND Kapitalschiff-Klassen anvisieren und abfeuern. Basen mit mehreren Ultimate-Kanonen gelten als praktisch unangreifbar fuer alles ausser massierten Elite-Flotten.", buildTime:150, maxCount:60,
    cost:{metall:1200000, kristall:900000, deuterium:500000}, stats:{waffen:28000, schild:20000, panzerung:200000} },
  // Dritte Schildkuppel (siehe Nutzerentscheidung: kommt trotz "Spezial"-Charakter in den
  // normalen Schild-Tab statt zur Spezialverteidigung) - deutlich staerker als die Grosse
  // Schildkuppel, aber gleiches Prinzip (gemeinsamer Pool statt Pro-Einheit-Verteilung, siehe
  // computeDomeSharedPool()), maxCount:1.
  { id:"gigantschildkuppel", name:"Gigant-Schildkuppel", img:"defense/gigantschildkuppel.jpg", lore:"Die Gigant-Schildkuppel ueberspannt nicht nur eine Basis, sondern gleich mehrere Sektoren mit einem einzigen, gewaltigen Energiefeld. Ihr Bau gilt als eines der teuersten Verteidigungsprojekte ueberhaupt - wer sie besitzt, gilt als praktisch unangreifbar.", buildTime:30, maxCount:1, isDome:true,
    cost:{metall:300000, kristall:300000, deuterium:50000}, stats:{waffen:0, schild:600000, panzerung:100000} }
];
