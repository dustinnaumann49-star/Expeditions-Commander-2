import type { ResearchDefinition } from '../types.js';

// 1:1 aus dem HTML-Prototyp uebernommen, seit Forschungsbaum-Umbau um mainBranch/parentId/
// driveType erweitert (siehe README "Geplante Erweiterungen" -> jetzt umgesetzt). Reihenfolge
// im Array spielt fuer die Baum-Darstellung keine Rolle mehr - die UI gruppiert per mainBranch
// und verbindet per parentId, nicht nach Listenposition.
export const RESEARCH: ResearchDefinition[] = 
[
  { id:"waffen", name:"Waffentechnik", img:"research/waffentechnik.png", lore:"Die Waffentechnik-Forschung begann mit einfachen Verbesserungen an Zündmechanismen und wuchs zu einer eigenen Wissenschaft heran. Jede Stufe bedeutet Jahre an Simulationen, bevor ein einziger Prototyp das Labor verlässt.", effectPerLevel:0.10,
    baseCost:{metall:60000, kristall:40000, deuterium:15000}, costGrowth:1.8,
    baseTimeHours:12, timeGrowth:1.6, mainBranch:"waffen" },
  { id:"schild", name:"Schildtechnik", img:"research/schildtechnik.png", lore:"Schildtechnik basiert auf Energiefeldern, die ursprünglich zum Schutz von Bergbau-Außenposten vor Strahlung entwickelt wurden. Erst später erkannte man ihr Potenzial im Kampfeinsatz.", effectPerLevel:0.10,
    baseCost:{metall:55000, kristall:55000, deuterium:15000}, costGrowth:1.8,
    baseTimeHours:12, timeGrowth:1.6, mainBranch:"verteidigung" },
  { id:"panzerung", name:"Panzerungtechnik", img:"research/panzerungtechnik.png", lore:"Panzerungtechnik ist die unglamouröseste aller Forschungsrichtungen, rettet aber nachweislich die meisten Besatzungen. Ingenieure testen neue Legierungen oft an ausrangierten Schiffsrümpfen, bevor sie in die Flotte übernommen werden.", effectPerLevel:0.10,
    baseCost:{metall:70000, kristall:40000, deuterium:10000}, costGrowth:1.8,
    baseTimeHours:12, timeGrowth:1.6, mainBranch:"verteidigung" },
  { id:"bauzeit", name:"Schiffbau-Reduktion", img:"research/bauzeit.png", lore:"Die Schiffbau-Reduktion optimiert nicht die Schiffe selbst, sondern die Werftprozesse dahinter – automatisierte Fertigungsstraßen, effizientere Materialflüsse. Kleine Stellschrauben, große Wirkung auf jede Warteschlange.", effectPerLevel:0.05,
    baseCost:{metall:65000, kristall:45000, deuterium:25000}, costGrowth:1.8,
    baseTimeHours:14, timeGrowth:1.6, mainBranch:"wirtschaft" },
  { id:"mining", name:"Mining-Effizienz", img:"research/mining.png", lore:"Mining-Effizienz-Forschung entstand aus der schlichten Beobachtung, dass jede zusätzliche Tonne Erz pro Stunde am Ende über den Ausgang eines Krieges entscheiden kann. Ressourcen gewinnen, bevor man sie verbraucht.", effectPerLevel:0.10,
    baseCost:{metall:80000, kristall:50000, deuterium:20000}, costGrowth:1.8,
    baseTimeHours:16, timeGrowth:1.6, mainBranch:"wirtschaft" },
  { id:"spionage", name:"Spionage", img:"research/spionage.png", lore:"Spionage-Technologie verbessert Sensorik und Datenauswertung, um feindliche Bewegungen frühzeitig zu erkennen. Wer hier vorne liegt, sieht den Gegner oft, bevor der Gegner überhaupt weiß, dass er beobachtet wird.", effectPerLevel:0.10,
    baseCost:{metall:90000, kristall:65000, deuterium:30000}, costGrowth:1.8,
    baseTimeHours:18, timeGrowth:1.6, mainBranch:"wirtschaft" },
  { id:"zielerfassung", name:"Zielerfassung", img:"research/zielerfassung.png", lore:"Zielerfassung verfeinert die Feuerleitsysteme, damit Schüsse gezielt gefährliche RapidFire-Ziele zuerst treffen. Ein kleiner Rechenvorteil im Gefecht, der über Sieg oder Niederlage entscheiden kann.", effectPerLevel:0.06,
    baseCost:{metall:75000, kristall:50000, deuterium:20000}, costGrowth:1.8,
    baseTimeHours:14, timeGrowth:1.6, mainBranch:"waffen", parentId:"waffen" },
  { id:"durchschlag", name:"Durchschlag (Overkill)", img:"research/durchschlag.png", lore:"Durchschlag-Forschung, von Veteranen nur 'Overkill' genannt, sorgt dafür, dass überschüssiger Schaden nicht verpufft, sondern das nächste Ziel trifft. Eine kalte, effiziente Weiterentwicklung der Kampfdoktrin.", effectPerLevel:0.05,
    baseCost:{metall:75000, kristall:50000, deuterium:20000}, costGrowth:1.8,
    baseTimeHours:14, timeGrowth:1.6, mainBranch:"waffen", parentId:"waffen" },
  { id:"schildregeneration", name:"Schild-Regeneration", img:"research/schildregeneration.png", lore:"Schild-Regeneration verbessert die Nachladeschaltkreise der Energiefelder, sodass zwischen zwei Gefechtsrunden mehr Kapazität wiederhergestellt wird. Ohne diese Forschung bleibt vom Schild nach einem Treffer nur ein Bruchteil übrig.", effectPerLevel:0.06,
    baseCost:{metall:70000, kristall:60000, deuterium:20000}, costGrowth:1.8,
    baseTimeHours:15, timeGrowth:1.6, mainBranch:"verteidigung", parentId:"schild" },
  { id:"praezision", name:"Präzision", img:"research/praezision.png", lore:"Präzision verfeinert die Feuerleitrechner, damit Schüsse ihr Ziel häufiger tatsächlich treffen statt ins Leere zu gehen. Ein kleiner Vorteil pro Stufe, der sich über eine ganze Schlacht gerechnet stark aufsummiert.", effectPerLevel:0.02,
    baseCost:{metall:65000, kristall:55000, deuterium:20000}, costGrowth:1.8,
    baseTimeHours:13, timeGrowth:1.6, mainBranch:"waffen", parentId:"zielerfassung" },
  { id:"ausweichen", name:"Ausweichmanöver", img:"research/ausweichen.png", lore:"Ausweichmanöver drillt Piloten darauf, im letzten Moment aus der Schusslinie zu ziehen. Kleine, wendige Schiffe profitieren am meisten – ein Schlachtschiff kann seiner Masse nun einmal nicht davonfliegen.", effectPerLevel:0.015,
    baseCost:{metall:70000, kristall:60000, deuterium:25000}, costGrowth:1.8,
    baseTimeHours:14, timeGrowth:1.6, mainBranch:"verteidigung", parentId:"panzerung" },
  { id:"kritischetreffer", name:"Kritische Treffer", img:"research/kritischetreffer.png", lore:"Kritische Treffer lehrt die Zielsysteme, Schwachstellen im gegnerischen Rumpf zu erkennen – Reaktorkopplungen, Munitionslager, Schildgeneratoren. Wer dort trifft, richtet doppelten Schaden an.", effectPerLevel:0.015,
    baseCost:{metall:80000, kristall:70000, deuterium:30000}, costGrowth:1.8,
    baseTimeHours:15, timeGrowth:1.6, mainBranch:"waffen", parentId:"durchschlag" },
  { id:"antrieb", name:"Antriebstechnik", img:"research/antrieb.png", lore:"Antriebstechnik verfeinert Schubdüsen und Treibstoffzufuhr, damit Flotten spürbar schneller zwischen den Sternen unterwegs sind – jede Stufe bedeutet kürzere Wartezeiten für jede Flugbewegung in der Galaxie.", effectPerLevel:0.03,
    baseCost:{metall:70000, kristall:50000, deuterium:30000}, costGrowth:1.8,
    baseTimeHours:16, timeGrowth:1.6, mainBranch:"antrieb" },

  // ===== NEU: Antriebsklassen (je Zweig nur fuer Schiffe DIESER Antriebsklasse, siehe driveType
  // in data/ships.ts) - stapelt zusaetzlich zur Antriebstechnik-Basis oben, ersetzt sie nicht. =====
  { id:"raketenantrieb", name:"Raketenantrieb", img:"research/raketenantrieb.png", lore:"Raketenantrieb ist die aelteste und robusteste aller Antriebsformen - klein, leicht, ideal fuer wendige Jaeger und die Versorgungsflotte, die staendig zwischen Basis und Sektor pendelt.", effectPerLevel:0.02,
    baseCost:{metall:60000, kristall:40000, deuterium:20000}, costGrowth:1.8,
    baseTimeHours:14, timeGrowth:1.6, mainBranch:"antrieb", parentId:"antrieb", driveType:"rakete" },
  { id:"impulsantrieb", name:"Impulsantrieb", img:"research/impulsantrieb.png", lore:"Impulsantrieb liefert deutlich mehr Schub als klassische Raketentriebwerke - der Standard fuer die mittelschwere Kreuzer-Klasse, die weder auf reine Wendigkeit noch auf rohe Groesse setzt.", effectPerLevel:0.02,
    baseCost:{metall:70000, kristall:50000, deuterium:25000}, costGrowth:1.8,
    baseTimeHours:15, timeGrowth:1.6, mainBranch:"antrieb", parentId:"antrieb", driveType:"impuls" },
  { id:"hyperraumantrieb", name:"Hyperraumantrieb", img:"research/hyperraumantrieb.png", lore:"Hyperraumantrieb faltet notduerftig den Raum vor gewaltigen Schiffsruempfen - die einzige Antriebsform, die Elite-Klasse-Schlachtschiffe und den Imperator ueberhaupt in Bewegung setzen kann.", effectPerLevel:0.02,
    baseCost:{metall:85000, kristall:65000, deuterium:35000}, costGrowth:1.8,
    baseTimeHours:17, timeGrowth:1.6, mainBranch:"antrieb", parentId:"antrieb", driveType:"hyperraum" },

  // ===== NEU: Mining-Spezialisierung (stapelt zusaetzlich zur Mining-Effizienz-Basis oben) =====
  { id:"mining_schiffe", name:"Mining-Boost: Schiffe", img:"research/mining_schiffe.png", lore:"Spezialisierte Foerderarme und Sortieranlagen an Bord jedes Mining-Schiffs - wirkt NUR auf den Ertrag der Flotte selbst, nicht auf die stationaeren Minen zu Hause.", effectPerLevel:0.05,
    baseCost:{metall:75000, kristall:55000, deuterium:20000}, costGrowth:1.8,
    baseTimeHours:15, timeGrowth:1.6, mainBranch:"wirtschaft", parentId:"mining" },
  { id:"mining_minen", name:"Mining-Boost: Minen", img:"research/mining_minen.png", lore:"Tiefere Bohrkoepfe und effizientere Foerderbaender fuer die stationaeren Minen-Gebaeude der Heimatbasis - wirkt NUR auf die passive Gebaeude-Produktion, nicht auf Mining-Schiffe unterwegs.", effectPerLevel:0.05,
    baseCost:{metall:75000, kristall:55000, deuterium:20000}, costGrowth:1.8,
    baseTimeHours:15, timeGrowth:1.6, mainBranch:"wirtschaft", parentId:"mining" },

  // ===== NEU: Bauzeit-Spezialisierung (stapelt zusaetzlich zur Schiffbau-Reduktion-Basis oben,
  // die weiterhin ALLE drei Kategorien gleichzeitig verkuerzt) =====
  { id:"bauzeit_gebaeude", name:"Bauzeit: Gebäude", img:"research/bauzeit_gebaeude.png", lore:"Spezialisierte Bautrupps und vorgefertigte Modulbauweise NUR fuer Gebaeude - Werften und Verteidigungsanlagen profitieren davon nicht.", effectPerLevel:0.03,
    baseCost:{metall:70000, kristall:50000, deuterium:25000}, costGrowth:1.8,
    baseTimeHours:15, timeGrowth:1.6, mainBranch:"wirtschaft", parentId:"bauzeit" },
  { id:"bauzeit_schiffe", name:"Bauzeit: Schiffe", img:"research/bauzeit_schiffe.png", lore:"Spezialisierte Fertigungsstrassen NUR fuer Schiffsruempfe - Gebaeude und Verteidigungsanlagen profitieren davon nicht.", effectPerLevel:0.03,
    baseCost:{metall:70000, kristall:50000, deuterium:25000}, costGrowth:1.8,
    baseTimeHours:15, timeGrowth:1.6, mainBranch:"wirtschaft", parentId:"bauzeit" },
  { id:"bauzeit_verteidigung", name:"Bauzeit: Verteidigung", img:"research/bauzeit_verteidigung.png", lore:"Vorgefertigte Geschuetzsockel und Schildgenerator-Module NUR fuer Verteidigungsanlagen - Gebaeude und Schiffe profitieren davon nicht.", effectPerLevel:0.03,
    baseCost:{metall:70000, kristall:50000, deuterium:25000}, costGrowth:1.8,
    baseTimeHours:15, timeGrowth:1.6, mainBranch:"wirtschaft", parentId:"bauzeit" }
];
