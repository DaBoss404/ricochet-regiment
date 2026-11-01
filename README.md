# Ricochet Regiment

A top-down co-op tank game for 1–4 players in the browser. Shells bounce off walls, mines clear crates, and you can revive a downed teammate by parking on their wreck.

Runs are endless. After every level, three slot machines spin to decide the next wave (each lands on an enemy type, then on how many of it), and the squad picks one of three skills. Every 10th level is a boss fight.

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

On the title screen, each player can change their tank color (D-pad left/right or the arrow buttons), their shell trail (D-pad up/down or the arrow buttons), and upload an image to use as their shell. Your choices are saved in the browser for each controller.

## Online play

Click **Play online** at the top of the page.

- One person clicks **Host a game** and shares the 5-letter room code.
- Friends open the same site, click **Play online**, enter the code and click **Join**.
- Up to 4 players in total, across up to 4 computers. Each computer can have more than one player on it.
- The host's browser runs the game for everyone, so the host should keep the game tab in front.
- **Voice chat** is off by default. Turn it on with the **Voice** button, V, or the controller's View button. You hear the others only while your own voice chat is on.

Online play uses [PeerJS](https://peerjs.com/) (MIT licensed, bundled as `peerjs.min.js`; license in `peerjs.LICENSE`) to connect browsers directly, with its free public server used only to introduce players to each other. Some strict school or office networks block direct connections; if a friend can't connect, try a different network.
