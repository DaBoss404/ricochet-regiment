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

**Phones as controllers, game on the TV (display-only host):** see [TV mode](#tv-mode-ipad--apple-tv-or-a-laptop-on-hdmi) below. A phone can also join any room by clicking **Play online**, entering the room code and tapping **Use this phone as a controller**.

The QR code is made with [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase (MIT licensed, bundled as `qrcode.js` with its license header).

## TV mode: iPad + Apple TV, or a laptop on HDMI

One device shows the game on the TV and runs it; up to four phones are the controllers. The display device never takes a player slot and shows no on-screen controls.

1. On the iPad (Safari) or laptop, open the site and click **Play online → Host as display only (TV)**.
2. Put that screen on the TV:
   - **iPad:** Control Center → Screen Mirroring → your Apple TV. Hold the iPad sideways. Tap **Full screen** at the top for a cleaner picture, or add the site to the Home Screen and open it from there.
   - **Laptop:** plug it into the TV with HDMI and use the TV as a mirrored or extended display; drag the window there and click **Full screen**.
3. Each player scans the QR code on the TV with their phone camera (or opens the site, taps **Play online**, enters the room code and taps **Use this phone as a controller**).
4. On each phone, tap **Join the game** (players get P1–P4 in order). While the TV shows the lobby, each phone shows a garage: a live preview of your tank firing with your shell trail, plus color, trail and tank pickers (locked tanks show what unlocks them). Tap **Start game** when everyone is ready; the phone then switches to the controller. The phones also pause (☰), resume (☰), quit to the lobby (B while paused), pick skills (stick + A) and restart after a game over (A). Nobody needs to touch the TV device.

Good to know:
- Keep the iPad or laptop awake, unlocked and on the game page. The page asks the browser to keep the screen on, but switching apps or locking the iPad pauses the game and can drop the phones.
- Screen mirroring copies the iPad's screen, so the iPad and the TV always show the same picture.
- A fifth phone can connect but waits until someone leaves; it can't take over a slot or start the game.
- If a phone locks or loses Wi-Fi, it reconnects by itself when you come back to the page; press A and it gets its old player number, color and tank back. The other players keep playing meanwhile.
- Tanks a phone can pick depend on unlocks saved on that phone.
- To end TV mode, tap the top of the iPad screen to show the menu buttons, open the room button and choose **Leave room**.
- **Host & play** (the other hosting button) works as before: the host device plays too, and friends join from their own computers or phones.

## Tests

Browser tests cover offline play, Host & play, and TV mode with five phones (joining, a full game, independent controls, pause/resume, disconnect and reconnect, restart, manual code entry). They need Node and Playwright with Chromium, and replace PeerJS with a local stand-in (`tests/fakepeer.js`):

```bash
node tests/tv-host.test.js
```

## Online play

Click **Play online** at the top of the page.

- One person clicks **Host & play** and shares the 5-letter room code (or **Host as display only (TV)**, see above).
- Friends open the same site, click **Play online**, enter the code and click **Join**.
- Up to 4 players in total, across up to 4 computers. Each computer can have more than one player on it.
- The host's browser runs the game for everyone, so the host should keep the game tab in front.
- **Voice chat** is off by default. Turn it on with the **Voice** button, V, or the controller's View button. You hear the others only while your own voice chat is on.

Online play uses [PeerJS](https://peerjs.com/) (MIT licensed, bundled as `peerjs.min.js`; license in `peerjs.LICENSE`) to connect browsers directly, with its free public server used only to introduce players to each other. Some strict school or office networks block direct connections; if a friend can't connect, try a different network.
