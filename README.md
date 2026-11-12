# Tank Team

A top-down co-op tank game for 1–4 players in the browser. Shells bounce off walls and mines clear crates. A destroyed tank sits out until the next level.

Runs are endless. After every level, three slot machines spin to decide the next wave (each lands on an enemy type, then on how many of it), and in a solo run you pick one of three skills after every 3rd level (co-op runs with 2 or more players have no skill picks). Every 10th level is a boss fight. Every 50th level is an elite boss: there is a giant boss for each of the 16 elite tanks (Prismarch, Maelstrom, Hivelord, Demolisher, Stormcoil, Impaler, Shrapnel King, Sunforge, Tempest, Ion Colossus, Bladestorm, Mothership, Inferno, Rail Tyrant, Skyfall and Grinder), each armed with a huge version of that tank's gun, and they take turns. If the squad is wiped out, you replay the same map. Enemy shells and mines never hurt other enemies.

Destroy 20 of an enemy type to unlock it as a playable tank: Hornet, Missile, Sniper, Shotgun, Brute, Splitter, Hive, Scorcher, Mortar, Spiker, Bulwark, Ghost, Blinker, Heavy, Laser, Bouncer, Summoner, Siege, Kamikaze, Magnet, Generator, Burrower, Engineer, Salvo, Orbiter, Double, Freezer, Clone, Pulse or Reflector. The Hive splits into two small tanks when destroyed (left stick/WASD steers one, right stick/arrow keys the other, and both fire on their own), and the Summoner calls in minion tanks that fight for you. The Clone's decoys charge the nearest enemy, shoot at it and sometimes dodge shells. Each plays differently (the Salvo, for example, fires bursts of 5 bouncing missiles). Every tank has its own skills that only show up while you drive it, and a solo Spiker never gets shooting skills.

There are also 16 elite tanks, each with its own special gun: Prism (bouncing laser), Vortex (mini black hole), Swarm (a fan of exploding missiles), Bomber, Tesla (chain lightning), Lancer (rail beam), Cluster, Plasma, Thunder, Ion (continuous beam), Shuriken, Carrier (auto-firing drones), Napalm, Railstorm, Starfall and Razor Disc. They unlock by reaching a level for the first time or by total kills across all your runs. A squad with a Spiker in it starts with 5 lives instead of 3. Unlock progress is saved in your browser and carries across runs; the title screen has a Delete progress button (click it twice) to start over. Pick your tank on the title screen with LB/RB, Z/C or the arrow buttons.

There are 120 skills across five rarities: Common, Rare, Epic, Legendary and Mythic. Most skills can be upgraded many times (up to 10 ranks), and each card shows exactly what the next rank changes. Rarer cards get a little more likely the deeper the run goes, and the Lucky Charm skill boosts them further.

The music is original and generated live in the browser: a snare-drum march that adds instruments as more kinds of enemies appear, an orchestral boss theme with war drums and choir, and a heavier elite boss theme. A trumpet fanfare plays whenever you win a fight.

The game is a single static page (`index.html`), so any static host works (this repo deploys as-is on Vercel).

## Controls

| | Xbox controller | Keyboard + mouse |
|---|---|---|
| Join | A | Space / Enter |
| Move | Left stick or D-pad | WASD |
| Aim | Right stick | Mouse |
| Fire | RT, RB or X | Click or Space |
| Mine | LT, LB or A | Right-click, E or Shift |
| Pause | Start | Esc or P |
| Friendly fire on/off | Y | F |
| Voice chat on/off (online) | View | V |
| Music on/off | | M (or the Music button) |

On the title screen, each player can change their tank color (D-pad left/right or the arrow buttons), their shell trail (D-pad up/down or the arrow buttons), and their tank type once unlocked (LB/RB, Z/C or the arrow buttons). Your choices are saved in the browser for each controller.

## Phones and tablets

On a touchscreen, on-screen controls appear: the left stick moves, the right stick aims (push it all the way out to fire), plus MINE and ☰ (pause/start) buttons and A/B on menus. Hold the phone sideways.

**Phone as a controller, game on the TV:** open the site in the TV's browser (or on a computer plugged into the TV), click **Play online → Host a game**, and scan the QR code that appears with a phone. The phone becomes a controller (sticks, A, B, LB/RB, MINE, ☰) and the game shows only on the TV. Up to 4 phones and controllers can mix. A phone can also join by clicking **Play online**, entering the room code and tapping **Use this phone as a controller**. Screen mirroring can't be detected by a web page, and a mirrored phone would show the controls on the TV too, so the TV needs to run the game itself.

The QR code is made with [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase (MIT licensed, bundled as `qrcode.js` with its license header).

## Online play

Click **Play online** at the top of the page.

- One person clicks **Host a game** and shares the 5-letter room code.
- Friends open the same site, click **Play online**, enter the code and click **Join**.
- Up to 4 players in total, across up to 4 computers. Each computer can have more than one player on it.
- The host's browser runs the game for everyone, so the host should keep the game tab in front.
- **Voice chat** is off by default. Turn it on with the **Voice** button, V, or the controller's View button. You hear the others only while your own voice chat is on.

Online play uses [PeerJS](https://peerjs.com/) (MIT licensed, bundled as `peerjs.min.js`; license in `peerjs.LICENSE`) to connect browsers directly, with its free public server used only to introduce players to each other. Some strict school or office networks block direct connections; if a friend can't connect, try a different network.
