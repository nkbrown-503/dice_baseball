# Dice Baseball 8-Bit

A retro-styled tabletop baseball game built with Python and Tkinter, with a separate browser-playable version in `docs/`. Pick home and away teams, choose a field, select the number of innings, then roll dice to resolve each at-bat.

## Features

- 8-bit inspired baseball visuals
- 30 selectable teams with team-colored uniforms
- Stadium, Backyard, and Parking Lot field options
- 3, 5, 7, or 9 inning games
- Animated dice rolls
- Scoreboard with runs, hits, errors, inning, half-inning, and outs
- In-game rules reference

## Requirements

- Python 3
- Tkinter, which is included with most standard Python installations

On some Linux distributions, Tkinter may need to be installed separately:

```bash
sudo apt install python3-tk
```

## Play in the Browser

The web version lives in `docs/` and is ready for GitHub Pages.

To publish it:

1. Push this repo to GitHub.
2. Go to **Settings** > **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select your branch and choose the `/docs` folder.
5. Save. GitHub will provide a playable URL for the game.

You can also open `docs/index.html` directly in a browser for local play.

## Running the Python Game

From the project directory, run:

```bash
python3 dice_baseball_8bit.py
```

If your system uses `python` for Python 3:

```bash
python dice_baseball_8bit.py
```

## How to Play

1. Start the game and select **Play Ball**.
2. Choose home and away teams with the arrow buttons.
3. Select the game length and field.
4. Roll the dice each at-bat.
5. The dice result determines the play outcome using the in-game rules table.
6. Continue until the selected number of innings is complete. Extra innings are played automatically if the score is tied.

## Dice Outcomes

The game uses two six-sided dice. Matching dice combinations produce baseball outcomes such as singles, doubles, triples, home runs, walks, strikeouts, errors, ground outs, fly outs, force outs, sacrifice flies, and double plays.

Use the **Rules** screen in the app to view the full result table and runner-advancement notes.
