# BETRIEB.md

Betriebswissen zum Server, getrennt von der Balance-Arbeit (die steht in `UEBERGABE.md` und
`UMSETZUNGSPLAN_BALANCE.md`). Angelegt am 26.08.2026 nach einem Ausfall von rund neun Stunden,
dessen Suche ohne dieses Dokument beim naechsten Mal wieder von vorn begaenne.

**Wer hier einsteigt, liest zuerst Abschnitt 1 und 2.** Der Rest ist Nachschlagewerk.

---

## 1. Die Anlage in einem Bild

| | |
|---|---|
| Anbieter | Hetzner Cloud, `coolify-ubuntu-8gb-hel1-2`, IP `62.238.40.197` |
| Verwaltung | Coolify auf Port 8000, Reverse Proxy Traefik |
| Anwendungen | **Client** `afazx32yqwig9p25poutsija-…` (Port 80) und **Server** `k135s6z99qoz05tou7s9v9r5` (Port 4000) |
| Spielstand | Docker-Volume `k135s6z99qoz05tou7s9v9r5-game-data`, eingehaengt als `/app/data` |
| Datenbank | SQLite im WAL-Modus: `game.db`, `game.db-wal`, `game.db-shm` |
| Erreichbar | `https://k135s6z99qoz05tou7s9v9r5.62.238.40.197.sslip.io` |

**Der Pfad im Container ist `/app/data`, nicht `/app/server/data`.** `db.ts` bildet ihn als
`__dirname/../data`; gestartet wird mit `node dist/index.js` aus `/app`, also liegt `db.js`
unter `/app/dist` und die Datenbank unter `/app/data`. Diese Annahme wurde am 26.08. einmal
falsch geraten — der Server startete sauber, legte eine leere Datenbank an und meldete
`0 Konten`. **Wenn im Log `[Spielstand-Groessen] 0 Konten` steht, ist der Volume-Pfad falsch,
nicht der Spielstand weg.**

---

## 2. Zugang — es gibt zwei, und nur einer ist ein echter

**Coolify-Login ist KEIN Serverzugang.** Name und Passwort gehoeren zur Anwendung Coolify.
Faellt Coolify aus, sind sie wertlos, und das Terminal in der Weboberflaeche ist dann ebenfalls
weg. Genau das war am 26.08. der Grund, eine Netzwerkreparatur zunaechst NICHT anzufassen.

**Der echte Zugang laeuft ueber SSH aus Termux:**

```
ssh -i ~/.ssh/ec root@62.238.40.197
```

Der private Schluessel liegt in Termux unter `~/.ssh/ec`. **Er existiert nur dort.** Wird
Termux deinstalliert oder werden seine Daten geloescht, ist der Zugang weg. Der oeffentliche
Teil steht in `/root/.ssh/authorized_keys` auf dem Server.

Zwei Dinge, die bei Gelegenheit erledigt gehoeren:
- **Den privaten Schluessel sichern** (Kopie ausserhalb von Termux).
- **Ein zweites Schluesselpaar vom Rechner aus anlegen**, damit der Zugang nicht an einem
  einzigen Geraet haengt.

Der aeltere Schluessel aus der Windows-Zeit ist mit der Neuinstallation auf Linux verloren
gegangen; auf dem Handy lag nur der oeffentliche Teil (eine Zeile, beginnend mit
`ssh-ed25519`) — der nuetzt zum Anmelden nichts.

**Ein Root-Passwort existiert vermutlich nicht.** Die Hetzner-Konsole (Cloud Console → Server →
Console) zeigt zwar einen Login-Prompt, ist ohne Passwort aber nicht benutzbar. Setzen liesse
es sich unter *Rescue → Reset root password*; das erfordert einen Neustart.

### Neuen Schluessel anlegen (Termux)

```
pkg install openssh -y
ssh-keygen -t ed25519 -f ~/.ssh/ec -N ""
echo "mkdir -p /root/.ssh && echo '$(cat ~/.ssh/ec.pub)' >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys"
```

Die Ausgabe der dritten Zeile ist die fertige Befehlszeile fuer den Server — einmal einfuegen,
einmal Enter. **`>>` mit zwei Zeichen**, sonst werden vorhandene Schluessel ueberschrieben.

---

## 3. Deploy: wann noetig, wann nicht

**Auto-Deploy ist abgeschaltet**, doppelt: GitHub-Webhook entfernt und in Coolify bei beiden
Anwendungen *Auto deploy = Manual deployments only*. Das ist Absicht.

| Geaendert | Deploy noetig? |
|---|---|
| `server/` oder `client/` | **ja** |
| `balance/`, `UEBERGABE.md`, `UMSETZUNGSPLAN_BALANCE.md`, `README.md`, dieses Dokument | **nein** |

Diese Dateien landen zwar im Image, werden aber von keinem Prozess gelesen. Ein Deploy haette
denselben Serverzustand zur Folge — nur mit Ausfallzeit.

**Warum die Ausfallzeit:** unter *Configuration → General* steht `Container naming` auf
*Generated name (rolling updates)*. Bei portgebundenen Anwendungen meldet Coolify dann
„Application has ports mapped to the host system, rolling update is not supported" und
**entfernt den alten Container, bevor der neue steht**. Scheitert der neue, ist das Spiel weg.
Am 26.08. loesten sechs reine Doku-Commits sechs Deploys aus; alle scheiterten, und der Server
war neun Stunden offline.

Wenn Deploys wieder automatisch laufen sollen, vorher diese Einstellung pruefen.

---

> **Vor jedem Deploy pruefen, ob Coolify ein Update anbietet — und es NICHT vorher einspielen.**
> Erst deployen, kontrollieren, dann aktualisieren. Begruendung und Log-Pfade in Abschnitt 4a.

## 4. Der Ausfall vom 26.08.2026 — Symptom, Ursache, Reparatur

**Symptom:** aus dem Spiel geworfen, danach beim Login „Passwort falsch".

**Wichtig:** `auth/routes.ts` gibt fuer *Nutzer nicht gefunden* und *Hash passt nicht* **denselben
Text** aus. „Passwort falsch" beweist also nichts. Und der Client zeigt bei einem
Netzwerkfehler „Failed to fetch" — das heisst, die Anfrage erreicht den Server gar nicht.
**Erst die genaue Fehlermeldung ansehen, bevor irgendetwas am Konto vermutet wird.**

**Ursache:** im Docker-Netzwerk `coolify` war das IPv6-Gateway **mit Praefixlaenge** gespeichert:

```
"Subnet":  "fde4:75c5:b9d4::/64"
"Gateway": "fde4:75c5:b9d4::1/64"     <- das /64 gehoert dort nicht hin
```

Eine Gateway-Adresse ist eine reine Adresse. Die Docker-Version 27.5.1 lehnt das ab:

```
Error: ParseAddr("fde4:75c5:b9d4::1/64"): unexpected character, want colon (at "/64")
```

Damit scheiterte `docker compose up` bei jedem Deploy. Das Netz stammte vom 19.07.2026, war
also von einer aelteren Version angelegt worden. **Warum es am 25.08. abends aufhoerte zu
funktionieren, ist ungeklaert** — ein Docker-Update ueber apt gab es nachweislich nicht
(`/var/log/apt/history.log` zeigt am 23.08. nur `vim` und `wget`). Moeglich ist ein
Coolify-Selbstupdate; belegt ist es nicht.

**Reparatur** (dauert etwa zehn Sekunden, per SSH, NICHT ueber das Coolify-Terminal — das
haengt selbst am Netz und verschwindet dabei):

```
cat > /root/fixnet.sh <<'EOF'
#!/bin/bash
set -x
for c in $(docker network inspect coolify --format '{{range .Containers}}{{.Name}} {{end}}'); do
  docker network disconnect -f coolify "$c"
done
docker network rm coolify
docker network create --attachable coolify
for c in coolify coolify-db coolify-redis coolify-realtime coolify-proxy <weitere>; do
  docker network connect coolify "$c" 2>&1
done
docker restart coolify-proxy
EOF
chmod +x /root/fixnet.sh && nohup /root/fixnet.sh > /root/fixnet.log 2>&1 &
```

`<weitere>` sind die Container aus der `inspect`-Zeile — am 26.08. haingen sechs am Netz,
darunter Coolify selbst und seine Datenbank. Ohne `--ipv6` legt Docker das Netz rein auf IPv4
an; IPv6 hat hier nie eine Rolle gespielt und war nur die Fehlerquelle.

Danach pruefen:

```
docker network inspect coolify --format '{{json .IPAM.Config}}'
```

Erwartung: nur noch `[{"Subnet":"10.0.1.0/24","Gateway":"10.0.1.1"}]`.

**Nachlauf:** der erste Deploy danach scheiterte erneut, aber an anderer Stelle —
`pull access denied for k135s6z99qoz05tou7s9v9r5`. Die von Coolify erzeugte
`docker-compose.yaml` verweist auf `image: 'k135…:HEAD'` ohne `build:`-Anweisung; existiert
dieses Image lokal nicht, versucht Docker es aus einer Registry zu laden. Behoben mit
**Deploy (without cache)**, das einen echten Neubau erzwingt.

---

## 4a. Coolify aktualisieren — Reihenfolge und Selbstupdate

**Regel: erst deployen, dann aktualisieren. Nie beides gleichzeitig.** Coolify sagt es im
Update-Dialog selbst:

> Any deployments running during the update process will fail.

Reihenfolge:

1. Deploy vollstaendig durchlaufen lassen, gruenes Ergebnis abwarten.
2. Im Spiel nachsehen, ob die Aenderung wirkt.
3. Erst danach **Upgrade now**.

Der Grund ist nicht nur der Warnhinweis. **Das Coolify-Selbstupdate ist der Hauptverdaechtige fuer
den Ausfall vom 25./26.08.2026** (Abschnitt 4): ein Docker-Update ueber apt gab es nachweislich
nicht, das kaputte IPv6-Gateway muss also anders entstanden sein. Belegt ist es nicht — aber wer
ein Update und einen Deploy zusammenlegt und danach einen Fehler sieht, kann die beiden Ursachen
nicht mehr trennen. Getrennt ausgefuehrt weiss man sofort, welcher Schritt es war.

**Wenn beim Update etwas schiefgeht, ZUERST hier nachsehen:**

```
/data/coolify/source/upgrade*
```

Der Pfad steht auch im Update-Dialog. Erst wenn dort nichts Brauchbares steht und das Symptom
nach dem Netz aussieht (`ParseAddr(... "/64")` im Deploy-Log, „Failed to fetch" im Client), ist
`fixnet.sh` aus Abschnitt 4 dran. Nicht umgekehrt — `fixnet.sh` nimmt das Docker-Netz auseinander
und ist kein Diagnosewerkzeug.

**Automatisches Update pruefen und ausschalten.** In den Coolify-Einstellungen gibt es eine
Auto-Update-Option. Ist sie an, springt die Version irgendwann von allein — und dann passiert
genau das, was die Regel oben verhindern soll: ein Update mitten in einem Deploy, zu einem
Zeitpunkt, den niemand gewaehlt hat. Das passt zum Muster des Ausfalls vom 25.08. (abends,
ohne Zutun). Bei zwei Spielern und manuellem Deploy gibt es keinen Grund fuer automatische
Updates.

**Vor groesseren Spruengen ein Snapshot**, falls der Hoster das anbietet. Bei Patch-Releases
(z.B. 4.3.11 → 4.3.12) ist das Risiko gering; bei einem Wechsel der zweiten Stelle lohnt es sich.

---

## 5. Notfall: das Spiel von Hand starten

Wenn Coolify nicht deployen kann, das Image aber vorhanden ist, laesst sich der Server direkt
starten. Das Spiel laeuft dann vollstaendig, nur eben ausserhalb von Coolifys Verwaltung.

```
docker images | grep k135          # Tag heraussuchen, neuester zuerst
```

```
docker run -d --name ec-server-manuell --restart unless-stopped --network coolify \
  -p 4000:4000 -e PORT=4000 \
  -l "traefik.enable=true" \
  -l "traefik.http.routers.ecman.rule=Host(\`k135s6z99qoz05tou7s9v9r5.62.238.40.197.sslip.io\`)" \
  -l "traefik.http.routers.ecman.entrypoints=https" \
  -l "traefik.http.routers.ecman.tls=true" \
  -l "traefik.http.services.ecman.loadbalancer.server.port=4000" \
  -v k135s6z99qoz05tou7s9v9r5-game-data:/app/data \
  k135s6z99qoz05tou7s9v9r5:<TAG>
```

Drei Dinge daran sind nicht optional:
- **`-v …-game-data:/app/data`** — ohne das legt der Server eine leere Datenbank an.
- **`--network coolify` und die Traefik-Labels** — sonst laeuft der Container zwar, aber
  Traefik kennt ihn nicht und der Client bekommt „Failed to fetch".
- **Die schraegen Anfuehrungszeichen** um die Domain gehoeren zur Traefik-Regel.

`JWT_SECRET` und `CLIENT_ORIGIN` sind weggelassen. Folge: ein Standardwert greift, alle
bestehenden Anmeldungen werden ungueltig, **jeder muss sich einmal neu einloggen**. Passwoerter
bleiben unveraendert. Wer das vermeiden will, holt die Werte aus Coolify (Server-Anwendung →
Environment Variables) und haengt `-e JWT_SECRET='…' -e CLIENT_ORIGIN='…'` an.

Pruefen:

```
docker logs ec-server-manuell --tail 15
```

Gesucht: `[Migration] N Konten durchgezogen` mit den echten Spielernamen. Steht dort
`0 Konten` und `KI-Spieler "…" angelegt`, ist der Volume-Pfad falsch — **sofort stoppen**,
bevor weitergeschrieben wird.

**Vor dem naechsten Coolify-Deploy muss der Handstart weg**, sonst blockiert er Port 4000:

```
docker rm -f ec-server-manuell
```

---

## 6. Sicherung

```
mkdir -p /root/sicherung
cp -a /var/lib/docker/volumes/k135s6z99qoz05tou7s9v9r5-game-data/_data/game.db* /root/sicherung/
ls -la /root/sicherung/
```

**Immer alle drei Dateien**: `game.db`, `game.db-wal`, `game.db-shm`. Die Datenbank laeuft im
WAL-Modus — eine Kopie von `game.db` allein kann Stunden an Schreibvorgaengen vermissen. Am
26.08. war die WAL-Datei mit 6,7 MB fast so gross wie die Datenbank selbst (8,3 MB).

Am besten den Container vorher stoppen. An einer offenen WAL-Datenbank zu schrauben, kann sie
beschaedigen.

---

## 7. Kompletter Reset (fuer den Server-Neustart nach den Balance-Aenderungen)

**Reihenfolge einhalten**, sonst greift es zu kurz:

1. Balance-Aenderungen in `server/src` einbauen
2. Ins Repo hochladen
3. **Deploy** — jetzt noetig, es ist echter Code
4. Erst danach der Reset

Andersherum wuerde man zuruecksetzen und dann den alten Stand weiterspielen, bis der Deploy
kommt.

```
mkdir -p /root/vor-reset
docker stop $(docker ps -q --filter name=k135)
cp -a /var/lib/docker/volumes/k135s6z99qoz05tou7s9v9r5-game-data/_data/game.db* /root/vor-reset/
rm -f /var/lib/docker/volumes/k135s6z99qoz05tou7s9v9r5-game-data/_data/game.db*
docker start $(docker ps -aq --filter name=k135)
```

Das genuegt fuer alles: die Tabellen entstehen beim Start neu (`CREATE TABLE IF NOT EXISTS`),
`index.ts` ruft `ensureBotUsers()` und `ensurePirateBases()` auf — KI-Spieler und angreifbare
Piratenbasen werden also automatisch neu angelegt. Betroffen sind alle sieben Tabellen:
`users`, `game_states`, `group_operations`, `galaxy_events`, `pirate_bases`, `alliances`,
`stations`. Danach muessen sich alle neu registrieren.

Wer die Konten behalten und nur die Spielstaende leeren will, loescht stattdessen die Zeilen
(braucht `sqlite3`): `loadPlayerState()` legt beim naechsten Login automatisch einen frischen
Stand an, die Passwoerter bleiben gueltig.

---

## 8. Diagnose-Reihenfolge bei „das Spiel geht nicht"

Von billig nach teuer. **Nicht mit dem Deploy-Knopf anfangen** — jeder Fehlversuch kostet
Plattenplatz und kann den laufenden Container mitnehmen.

1. **Fehlermeldung im Browser genau lesen.** „Failed to fetch" = Netzwerk, kommt nie beim
   Server an. „Nutzername oder Passwort falsch" = Server antwortet, Konto oder Passwort.
2. **Laeuft ueberhaupt etwas?** `docker ps --format "{{.Names}}\t{{.Status}}"`
3. **Antwortet der Server lokal?**
   `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/api/game/data`
   → `401` ist gut: er laeuft und weist nur die Anfrage ohne Token ab. Kommt das, ist es
   reines Routing (Traefik, Netzwerk, Labels), nicht der Server.
4. **Liegt der Spielstand noch da?**
   `find /var/lib/docker/volumes -name "game.db*"`
5. **Erst dann das Deploy-Log.** Der lange rote Block ist nur das Echo des Kommandos; die
   eigentliche Fehlerzeile steht **darunter**. Im Log-Suchfeld nach `Error` suchen.
6. **Ressourcen**, falls nichts davon greift: `df -h /`, `free -h`, `docker system df`.

**Zwei Irrwege aus dem 26.08., damit sie sich nicht wiederholen:** die Festplatte war nicht
voll (42 % belegt, 42 GB frei) und der Docker-Netzwerkpool nicht erschoepft (5 Netze). Beides
sind plausible Verdaechtigungen nach 500+ Deployments — hier waren sie falsch. **Die
Fehlerzeile aus dem Log haette beides in einer Minute erledigt.**

---

## 9. Der Datenverbrauch vom 27.08.2026 — 60 GB in einer Nacht

**Symptom:** ueber Nacht 60 GB Mobilfunkvolumen und ein leerer Akku, im Android-Menue beides
Termux zugeordnet.

**Kein Einbruch.** Geprueft und sauber: `docker ps` zeigte acht Container, alle bekannt, kein
fremdes Image. `ps aux --sort=-%cpu` zeigte keinen auffaelligen Prozess. `last -20` zeigte
ausschliesslich eigene Anmeldungen (`10.0.1.5` ist das Coolify-Terminal von innen, die
Mobilfunk-IP war die eigene).

**Was tatsaechlich passierte**, aus den Hetzner-Graphen (Server → Graphs → 12 Stunden):

| Zeitraum | Beobachtung |
|---|---|
| ca. 01:00 bis 03:30 | Netzwerk **out** in Wellen bis 8 MB/s, **20.000 pps**, CPU bis **300 %** |
| Festplatte | unauffaellig |
| ab 03:30 | schlagartig Ende (Handy ging aus) |

Dazu passend in `last`:

```
root  pts/2  <eigene Mobilfunk-IP>  Wed Aug 26 16:11 - 02:38  (10:27)
```

Eine SSH-Sitzung, **zehneinhalb Stunden offen**. Das Ende deckt sich mit dem Abbruch der
Verkehrswelle.

**Eine Sitzung, die nur am Prompt steht, verbraucht nichts** — wenige Kilobyte pro Stunde. Die
Last passt zu einem Befehl, der ununterbrochen Ausgabe erzeugte und ueber die Verbindung
schickte; die 300 % CPU entstehen dabei durch das laufende Verschluesseln. Welcher Befehl es
war, ist mit dem Schliessen der Sitzung verloren und liess sich nicht mehr klaeren.

**Der wahrscheinlichste Kandidat ist `docker logs` ohne `--tail` oder mit `-f`.** Beides laeuft
unbegrenzt weiter; `-f` sogar dauerhaft, weil es auf neue Zeilen wartet. Bei einem Server, der
alle zwei Minuten einen Heartbeat protokolliert, sendet das endlos.

### Regeln, die daraus folgen

- **Nach der Arbeit `exit`**, danach Termux ueber die Benachrichtigung beenden. Die App zu
  schliessen beendet den Prozess NICHT — eine SSH-Sitzung ueberlebt so die ganze Nacht.
- **`docker logs` nie ohne `--tail`**, und `-f` ueber Mobilfunk gar nicht.
- **Laengere Ausgaben abgekoppelt in eine Datei** (`nohup … > /root/datei.log 2>&1 &`) und die
  Datei danach mit `tail` lesen, statt den Strom ueber die Verbindung laufen zu lassen.
- **Bei Serverarbeit WLAN bevorzugen.**
- **Bei unerklaerlichem Verbrauch zuerst die Hetzner-Graphen ansehen**, Zeitraum auf 12 oder 24
  Stunden stellen. Die Fuenf-Minuten-Ansicht ist der Standard und zeigt eine Nacht nicht. Ist
  die Kurve dort flach, hat der Verkehr den Server nie beruehrt und die Zuordnung im
  Android-Menue taeuscht.

---

## 10. Merksaetze

- **Ein Login in eine Verwaltungsoberflaeche ist kein Zugang zum Server darunter.**
- **Eine Fehlermeldung, die zwei Faelle zusammenfasst, beweist keinen von beiden.**
- **Wer ein Netzwerk anfasst, an dem die eigene Verwaltungsoberflaeche haengt, braucht vorher
  einen Weg hinein, der ohne sie funktioniert — und muss ihn ausprobiert haben, nicht nur
  vermuten.**
- **Laengere Operationen abgekoppelt starten** (`nohup … &`) und das Protokoll hinterher lesen.
  Das Coolify-Terminal bricht alle 20 Sekunden ab; eine Kette, die mittendrin reisst, ist
  schlimmer als gar keine.
- **Pfade und Feldnamen am Code nachsehen, nicht raten.** Der falsch geratene `/app/server/data`
  hat einen kompletten Fehlstart gekostet; die richtige Antwort stand in drei Zeilen `db.ts`.
- **Nie zwei Veraenderungen gleichzeitig ausrollen.** Deploy und Coolify-Update getrennt, mit
  einer Kontrolle dazwischen. Sonst ist bei einem Fehler nicht mehr zu unterscheiden, welcher der
  beiden Schritte ihn verursacht hat — genau die Lage, in der der Ausfall vom 25.08. bis heute
  ungeklaert ist (Abschnitt 4a).
