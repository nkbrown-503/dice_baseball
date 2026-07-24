const WIDTH = 1100;
const HEIGHT = 720;

const TITLE_BACKGROUND_FILE = "stadium_pictures/title_background.png";
const BACKGROUND_FILES = {
  Stadium: "stadium_pictures/stadium.png",
  Backyard: "stadium_pictures/backyard.png",
  "Parking Lot": "stadium_pictures/parking_lot.png",
};
const CHARACTER_DIR = "character_sprites";
const SPRITE_ROLES = ["pitcher", "catcher", "first_baseman", "infielder", "outfielder", "batter", "runner"];
const SPRITE_PLACEHOLDERS = {
  "255,0,0": "primary",
  "0,255,0": "secondary",
  "0,0,255": "accent",
  "255,0,255": "skin",
  "0,255,255": "hair",
};

const PALETTE = {
  cream: "#f6e7c8",
  mustard: "#d6a33a",
  grass: "#548b45",
  dustyRed: "#b7473f",
  sky: "#78aac4",
  orangeBrown: "#a85f2e",
  navy: "#202f4f",
  charcoal: "#30313a",
  brown: "#5b3a29",
  card: "#fff0ce",
  shadow: "#c68a45",
};

const COLOR_MAP = {
  red: "#b83032",
  black: "#22242a",
  navy: "#1e2f54",
  orange: "#d36d28",
  blue: "#2e67b1",
  silver: "#b8b8aa",
  purple: "#6b4a9e",
  "royal blue": "#2b63bd",
  gold: "#d1a735",
  gray: "#8f8f86",
  green: "#3d7a52",
  brown: "#7a4b2a",
  teal: "#248a8b",
  "light blue": "#7fb7d6",
};

const TEAMS = [
  ["Anaheim", "green", "gold"],
  ["Arizona", "red", "black"],
  ["Atlanta", "navy", "red"],
  ["Baltimore", "orange", "black"],
  ["Boston", "red", "navy"],
  ["Chicago", "blue", "red"],
  ["Chicago", "black", "silver"],
  ["Cincinnati", "red", "black"],
  ["Cleveland", "navy", "red"],
  ["Colorado", "purple", "black"],
  ["Detroit", "navy", "orange"],
  ["Houston", "navy", "orange"],
  ["Kansas City", "royal blue", "gold"],
  ["Los Angeles", "red", "navy"],
  ["Los Angeles", "blue", "red"],
  ["Miami", "black", "blue"],
  ["Milwaukee", "navy", "gold"],
  ["Minnesota", "navy", "red"],
  ["New York", "blue", "orange"],
  ["New York", "navy", "gray"],
  ["Philadelphia", "red", "blue"],
  ["Pittsburgh", "black", "gold"],
  ["San Diego", "brown", "gold"],
  ["San Francisco", "orange", "black"],
  ["Seattle", "navy", "teal"],
  ["St. Louis", "red", "navy"],
  ["Tampa Bay", "navy", "light blue"],
  ["Texas", "blue", "red"],
  ["Toronto", "blue", "red"],
  ["Washington", "red", "navy"],
];

const RULES = [
  [[1, 1], "Double (2)"],
  [[1, 2], "Ground Out (DP)"],
  [[1, 3], "Walk"],
  [[1, 4], "Single (1)"],
  [[1, 5], "Ground Out (DP)"],
  [[1, 6], "Strikeout"],
  [[2, 2], "Double (3)"],
  [[2, 3], "Pop Out"],
  [[2, 4], "Single (2)"],
  [[2, 5], "Strikeout"],
  [[2, 6], "Ground Out (FO)"],
  [[3, 3], "Triple"],
  [[3, 4], "Strikeout"],
  [[3, 5], "Ground Out (FC)"],
  [[3, 6], "Fly Out"],
  [[4, 4], "Error (1)"],
  [[4, 5], "Fly Out"],
  [[4, 6], "Fly Out (SAC)"],
  [[5, 5], "Single (1)"],
  [[5, 6], "Pop Out"],
  [[6, 6], "Home run"],
];

const NOTES = [
  "(DP) Double Play on lead runner and batter if a force available. If no force, runners do not advance.",
  "(FC) Fielders choice, batter out, runners advance 1 base.",
  "(FO) Force out, lead runner out if force available. If not force, batter out, runners advance 1 base.",
  "(1) Other runners advance 1 base   (2) Other runners advance 2 bases   (3) Other runners advance 3 bases",
];

const CAP_LETTERS = {
  "New York": "NY",
  "Los Angeles": "LA",
  "San Francisco": "SF",
  "St. Louis": "SL",
};

class DiceBaseballWeb {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.clickables = [];
    this.homeIndex = this.teamIndex("Pittsburgh", "black", "gold");
    this.awayIndex = this.teamIndex("Cincinnati", "red", "black");
    this.selectedInnings = 3;
    this.selectedField = "Stadium";
    this.diceValues = [1, 1];
    this.rolling = false;
    this.gameActive = false;
    this.gameOver = false;
    this.winner = null;
    this.screen = "home";
    this.backgroundImages = new Map();
    this.spriteImages = new Map();
    this.spriteCache = new Map();
    this.loadBackgroundImages();
    this.loadSpriteImages();
    this.canvas.addEventListener("click", (event) => this.onClick(event));
    this.canvas.addEventListener("touchstart", (event) => {
      event.preventDefault();
      const touch = event.changedTouches[0];
      this.onClick(touch);
    }, { passive: false });
    this.showHome();
  }

  loadBackgroundImages() {
    const paths = [TITLE_BACKGROUND_FILE, ...Object.values(BACKGROUND_FILES)];
    paths.forEach((path) => {
      const image = new Image();
      image.onload = () => {
        if (this.screen === "home") this.showHome();
        else if (this.screen === "game") this.showGame();
      };
      image.src = path;
      this.backgroundImages.set(path, image);
    });
  }

  loadSpriteImages() {
    SPRITE_ROLES.forEach((role) => this.loadSpriteImage(role));
  }

  loadSpriteImage(name, optional = false) {
    const image = new Image();
    image.onload = () => {
      if (this.screen === "game") this.showGame();
    };
    image.onerror = () => {
      if (!optional) this.spriteImages.delete(name);
    };
    image.src = `${CHARACTER_DIR}/${name}.png`;
    this.spriteImages.set(name, image);
  }

  drawScaledBackgroundImage(path) {
    const image = this.backgroundImages.get(path);
    if (!image || !image.complete || !image.naturalWidth) return false;
    const scale = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight);
    const sw = WIDTH / scale;
    const sh = HEIGHT / scale;
    const sx = Math.max(0, (image.naturalWidth - sw) / 2);
    const sy = Math.max(0, (image.naturalHeight - sh) / 2);
    this.ctx.drawImage(image, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);
    return true;
  }

  font(size, weight = "bold") {
    return `${weight} ${size}px Courier, monospace`;
  }

  text(x, y, text, color, size, options = {}) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = this.font(size, options.weight || "bold");
    ctx.textAlign = options.align || "center";
    ctx.textBaseline = options.baseline || "middle";
    if (options.maxWidth) {
      ctx.fillText(text, x, y, options.maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  rect(x, y, w, h, fill, stroke = null, lineWidth = 1) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  polygon(points, fill, stroke = null, lineWidth = 1) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  }

  circle(x, y, r, fill, stroke = null, lineWidth = 1) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  oval(x, y, w, h, fill, stroke = null, lineWidth = 1) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  line(points, color, width = 1, dashed = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (dashed) ctx.setLineDash([12, 9]);
    ctx.stroke();
    ctx.restore();
  }

  shade(color, amount) {
    const clean = color.replace("#", "");
    const channels = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
    const adjusted = channels.map((value) => {
      if (amount >= 0) return Math.round(value + (255 - value) * amount);
      return Math.round(value * (1 + amount));
    });
    return `#${adjusted.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }

  hexToRgb(color) {
    const clean = color.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
  }

  shadeRgb(rgb, factor) {
    return rgb.map((value) => Math.max(0, Math.min(255, Math.round(value * factor))));
  }

  spriteTemplateName(role, state) {
    if (state && state !== "idle") {
      const stateName = `${role}_${state}`;
      const stateImage = this.spriteImages.get(stateName);
      if (stateImage && stateImage.complete && stateImage.naturalWidth) return stateName;
    }
    const image = this.spriteImages.get(role);
    if (image && image.complete && image.naturalWidth) return role;
    return null;
  }

  getSprite(role, primary, secondary, skin, hair, size, facing = "right", state = "idle") {
    const templateName = this.spriteTemplateName(role, state);
    if (!templateName) return null;
    const key = [templateName, primary, secondary, skin, hair, size[0], size[1], facing].join("|");
    if (this.spriteCache.has(key)) return this.spriteCache.get(key);

    const source = this.spriteImages.get(templateName);
    const primaryRgb = this.hexToRgb(primary);
    const palette = {
      primary: primaryRgb,
      secondary: this.hexToRgb(secondary),
      accent: this.shadeRgb(primaryRgb, 1.22),
      skin: this.hexToRgb(skin),
      hair: this.hexToRgb(hair),
    };

    const recolored = document.createElement("canvas");
    recolored.width = source.naturalWidth;
    recolored.height = source.naturalHeight;
    const recolorCtx = recolored.getContext("2d");
    recolorCtx.drawImage(source, 0, 0);
    const imageData = recolorCtx.getImageData(0, 0, recolored.width, recolored.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const placeholder = SPRITE_PLACEHOLDERS[`${imageData.data[i]},${imageData.data[i + 1]},${imageData.data[i + 2]}`];
      if (!placeholder) continue;
      const [r, g, b] = palette[placeholder];
      imageData.data[i] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
    }
    recolorCtx.putImageData(imageData, 0, 0);

    const scale = Math.min(size[0] / recolored.width, size[1] / recolored.height, 1);
    const width = Math.max(1, Math.round(recolored.width * scale));
    const height = Math.max(1, Math.round(recolored.height * scale));
    const output = document.createElement("canvas");
    output.width = width;
    output.height = height;
    const outputCtx = output.getContext("2d");
    outputCtx.imageSmoothingEnabled = false;
    if (facing === "left") {
      outputCtx.translate(width, 0);
      outputCtx.scale(-1, 1);
    }
    outputCtx.drawImage(recolored, 0, 0, width, height);
    this.spriteCache.set(key, output);
    return output;
  }

  drawSpriteCharacter(role, x, groundY, primary, secondary, skin, hair, size = [70, 90], facing = "right", state = "idle") {
    const sprite = this.getSprite(role, primary, secondary, skin, hair, size, facing, state);
    if (!sprite) return false;
    this.ctx.drawImage(sprite, x - sprite.width / 2, groundY - sprite.height);
    return true;
  }

  clear() {
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.clickables = [];
  }

  panel(x1, y1, x2, y2, fill = PALETTE.card, outline = PALETTE.navy, width = 5) {
    const points = [
      [x1 + 8, y1], [x2 - 14, y1 + 4], [x2, y1 + 12], [x2 - 5, y2 - 8],
      [x2 - 18, y2], [x1 + 10, y2 - 3], [x1, y2 - 15], [x1 + 4, y1 + 11],
    ];
    this.polygon(points, fill, outline, width);
  }

  addClickable(x1, y1, x2, y2, action) {
    this.clickables.push({ x1, y1, x2, y2, action });
  }

  button(x1, y1, x2, y2, label, action, fill = PALETTE.mustard, selected = false) {
    const color = selected ? PALETTE.dustyRed : fill;
    this.panel(x1, y1, x2, y2, color, PALETTE.brown, 4);
    const size = label.length > 13 ? 17 : 20;
    this.text((x1 + x2) / 2 + 2, (y1 + y2) / 2 + 2, label, "#795020", size);
    this.text((x1 + x2) / 2, (y1 + y2) / 2, label, PALETTE.cream, size);
    this.addClickable(x1, y1, x2, y2, action);
  }

  titleText(x, y, label, size = 44) {
    this.text(x + 4, y + 4, label, PALETTE.brown, size);
    this.text(x, y, label, PALETTE.dustyRed, size);
    this.text(x, y - 6, label, PALETTE.mustard, size);
  }

  onClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (WIDTH / rect.width);
    const y = (event.clientY - rect.top) * (HEIGHT / rect.height);
    for (let i = this.clickables.length - 1; i >= 0; i -= 1) {
      const item = this.clickables[i];
      if (x >= item.x1 && x <= item.x2 && y >= item.y1 && y <= item.y2) {
        item.action();
        return;
      }
    }
  }

  teamIndex(name, main, secondary) {
    const index = TEAMS.findIndex((team) => team[0] === name && team[1] === main && team[2] === secondary);
    return index >= 0 ? index : 0;
  }

  teamName(side) {
    return TEAMS[side === "home" ? this.homeIndex : this.awayIndex][0];
  }

  teamColors(side) {
    const team = TEAMS[side === "home" ? this.homeIndex : this.awayIndex];
    return [COLOR_MAP[team[1]], COLOR_MAP[team[2]]];
  }

  offenseSide() {
    return this.half === "top" ? "away" : "home";
  }

  defenseSide() {
    return this.half === "top" ? "home" : "away";
  }

  totalRuns(side) {
    return this.teamStats[side].runs.reduce((total, runs) => total + runs, 0);
  }

  ensureScoreSlots() {
    for (const side of ["away", "home"]) {
      while (this.teamStats[side].runs.length < this.inning) this.teamStats[side].runs.push(0);
    }
  }

  resetGameState() {
    this.gameActive = true;
    this.gameOver = false;
    this.winner = null;
    this.inning = 1;
    this.half = "top";
    this.outs = 0;
    this.bases = [null, null, null];
    this.batterReaction = "ready";
    this.batterSide = Math.random() < 0.5 ? -1 : 1;
    this.lastResult = "Roll to begin";
    this.simpleResult = "";
    this.simpleResultToken = 0;
    this.outMarkers = [];
    this.diceValues = [1, 1];
    this.teamStats = {
      away: { runs: [], hits: 0, errors: 0, batters: 0, strikeouts: 0 },
      home: { runs: [], hits: 0, errors: 0, batters: 0, strikeouts: 0 },
    };
    this.ensureScoreSlots();
  }

  showHome() {
    this.screen = "home";
    this.clear();
    if (!this.drawScaledBackgroundImage(TITLE_BACKGROUND_FILE)) this.drawBackground();
    this.panel(240, 80, 860, 255, PALETTE.card, PALETTE.navy, 7);
    this.titleText(550, 145, "DICE BASEBALL", 46);
    this.text(550, 210, "Neighborhood tabletop baseball", PALETTE.navy, 19);
    this.drawBaseballCard(120, 108, "HOME", "#b83032", "#1e2f54");
    this.drawBaseballCard(910, 108, "AWAY", "#2b63bd", "#d1a735");
    this.button(410, 330, 690, 405, "Play Ball", () => this.showSetup(), PALETTE.dustyRed);
    this.button(410, 430, 690, 505, "Rules", () => this.showRules(), PALETTE.mustard);
    this.text(550, 660, "Browser version — Python edition remains in the repo", PALETTE.cream, 14);
  }

  drawBackground() {
    this.rect(0, 0, WIDTH, HEIGHT, PALETTE.sky);
    this.rect(0, 452, WIDTH, HEIGHT - 452, PALETTE.grass);
    this.polygon([[0, 500], [180, 430], [340, 488], [530, 420], [720, 478], [910, 425], [WIDTH, 490], [WIDTH, HEIGHT], [0, HEIGHT]], "#5f974b");
    for (let x = 30; x < WIDTH; x += 95) {
      this.rect(x, 392, 14, 73, "#704820", PALETTE.brown, 2);
      this.oval(x - 30, 340, 75, 75, "#477b3e", PALETTE.navy, 3);
    }
    this.polygon([[175, 470], [550, 335], [925, 470], [790, 610], [310, 610]], "#cf9a5a", PALETTE.brown, 5);
    this.polygon([[550, 355], [625, 430], [550, 505], [475, 430]], PALETTE.cream, PALETTE.brown, 4);
  }

  drawBaseballCard(x, y, label, main, secondary) {
    this.panel(x, y, x + 130, y + 180, PALETTE.cream, PALETTE.brown, 4);
    this.drawHat(x + 65, y + 85, main, secondary, label[0], 0.55, "right");
    this.text(x + 65, y + 153, label, PALETTE.navy, 16);
  }

  showRules() {
    this.screen = "rules";
    this.clear();
    this.rect(0, 0, WIDTH, HEIGHT, PALETTE.cream);
    this.rect(0, 0, WIDTH, 82, PALETTE.sky, PALETTE.navy, 4);
    this.button(28, 18, 270, 62, "Return to Home", () => this.showHome(), PALETTE.orangeBrown);
    this.titleText(635, 42, "RULES", 32);
    this.panel(42, 94, 1058, 625, PALETTE.card, PALETTE.navy, 5);
    this.text(260, 122, "DICE", PALETTE.dustyRed, 18);
    this.text(625, 122, "RESULT", PALETTE.dustyRed, 18);
    let y = 148;
    RULES.forEach(([dice, result], i) => {
      this.rect(64, y - 11, 972, 23, i % 2 === 0 ? "#f9e2b4" : "#efd49f");
      this.drawDie(222, y - 10, 20, dice[0]);
      this.drawDie(256, y - 10, 20, dice[1]);
      this.text(325, y, `${dice[0]}/${dice[1]}`, PALETTE.navy, 14, { align: "left" });
      this.text(520, y, result, PALETTE.charcoal, 14, { align: "left" });
      y += 23;
    });
    let noteY = 646;
    NOTES.forEach((note) => {
      this.text(550, noteY, note, PALETTE.brown, 11);
      noteY += 17;
    });
  }

  showSetup() {
    this.screen = "setup";
    this.clear();
    this.drawBackground();
    this.titleText(550, 48, "SELECT GAME", 36);
    this.button(28, 18, 228, 62, "Return Home", () => this.showHome(), PALETTE.orangeBrown);
    this.teamSelector(45, 122, "Home", this.homeIndex, (amount) => this.changeHome(amount), "right");
    this.teamSelector(785, 122, "Away", this.awayIndex, (amount) => this.changeAway(amount), "left");
    this.panel(330, 120, 770, 610, PALETTE.card, PALETTE.navy, 6);
    this.text(550, 168, "Game Innings", PALETTE.dustyRed, 20);
    [3, 5, 7, 9].forEach((inning, i) => {
      const x = [382, 482, 582, 682][i];
      this.button(x - 36, 202, x + 36, 258, String(inning), () => this.setInnings(inning), PALETTE.mustard, this.selectedInnings === inning);
    });
    this.text(550, 318, "Select Field", PALETTE.dustyRed, 20);
    [["Stadium", 390], ["Backyard", 550], ["Parking Lot", 710]].forEach(([field, x]) => {
      this.button(x - 72, 352, x + 72, 408, field, () => this.setField(field), PALETTE.grass, this.selectedField === field);
    });
    this.button(410, 505, 690, 580, "Play Ball", () => this.startGame(), PALETTE.dustyRed);
  }

  teamSelector(x, y, role, index, changeCallback, direction) {
    const [name, mainName, secondaryName] = TEAMS[index];
    const main = COLOR_MAP[mainName];
    const secondary = COLOR_MAP[secondaryName];
    this.panel(x, y, x + 270, y + 485, PALETTE.card, PALETTE.brown, 6);
    this.text(x + 135, y + 38, `${role} Team`, PALETTE.dustyRed, 22);
    this.button(x + 18, y + 86, x + 72, y + 136, "<", () => changeCallback(-1), PALETTE.orangeBrown);
    this.button(x + 198, y + 86, x + 252, y + 136, ">", () => changeCallback(1), PALETTE.orangeBrown);
    this.text(x + 135, y + 111, name, PALETTE.navy, name.length > 12 ? 15 : 17, { maxWidth: 135 });
    const letters = CAP_LETTERS[name] || name[0];
    this.drawHat(x + 135, y + 258, main, secondary, letters, 1.0, direction);
  }

  setInnings(innings) {
    this.selectedInnings = innings;
    this.showSetup();
  }

  setField(field) {
    this.selectedField = field;
    this.showSetup();
  }

  changeHome(amount) {
    this.homeIndex = (this.homeIndex + amount + TEAMS.length) % TEAMS.length;
    this.showSetup();
  }

  changeAway(amount) {
    this.awayIndex = (this.awayIndex + amount + TEAMS.length) % TEAMS.length;
    this.showSetup();
  }

  startGame() {
    this.resetGameState();
    this.showGame();
  }

  endGameToHome() {
    this.gameActive = false;
    this.gameOver = false;
    this.winner = null;
    this.showHome();
  }

  returnToSetupAfterGame() {
    this.gameActive = false;
    this.gameOver = false;
    this.winner = null;
    this.showSetup();
  }

  showGame() {
    if (!this.teamStats) this.resetGameState();
    this.screen = "game";
    this.clear();
    this.drawFieldScene(this.selectedField);
    this.drawPlayers();
    this.drawScoreboard();
    this.button(20, 18, 170, 62, "End Game", () => this.endGameToHome(), PALETTE.orangeBrown);
    this.drawDiceArea();
    if (this.gameOver) this.drawVictoryOverlay();
  }

  drawFieldScene(field) {
    if (!this.drawScaledBackgroundImage(BACKGROUND_FILES[field])) {
      this.drawSky();
      if (field === "Parking Lot") this.drawParkingLotBackground();
      else if (field === "Backyard") this.drawBackyardBackground();
      else this.drawStadiumBackground();
      this.drawPlayableField(field);
    }
    this.text(550, 33, field.toUpperCase(), PALETTE.cream, 24);
  }

  drawSky() {
    this.rect(0, 0, WIDTH, HEIGHT, PALETTE.sky);
    [[180, 78], [780, 70], [965, 120]].forEach(([x, y]) => {
      this.oval(x, y, 56, 28, PALETTE.cream, PALETTE.navy, 2);
      this.oval(x + 32, y - 12, 56, 42, PALETTE.cream, PALETTE.navy, 2);
      this.rect(x + 20, y + 12, 56, 18, PALETTE.cream);
    });
  }

  drawStadiumBackground() {
    this.rect(0, 245, WIDTH, HEIGHT - 245, "#5f9b4d");
    this.rect(68, 170, 964, 90, "#d8c178", PALETTE.navy, 5);
    for (let x = 96; x < 1000; x += 42) {
      const color = Math.floor(x / 42) % 2 === 0 ? PALETTE.dustyRed : PALETTE.mustard;
      this.rect(x, 190, 25, 42, color, PALETTE.brown, 2);
      this.oval(x + 2, 178, 20, 17, "#f0dca6", PALETTE.brown, 1);
    }
    this.rect(438, 116, 224, 54, PALETTE.navy, PALETTE.cream, 4);
    this.text(550, 139, "DICE PARK", PALETTE.mustard, 17);
    this.text(550, 160, "0 0 0", PALETTE.cream, 11);
    this.rect(55, 258, 990, 44, "#516b58", PALETTE.navy, 5);
  }

  drawBackyardBackground() {
    this.rect(0, 245, WIDTH, HEIGHT - 245, "#67994e");
    for (let x = 0; x < WIDTH; x += 72) this.rect(x, 235, 42, 41, PALETTE.cream, PALETTE.brown, 3);
    [[70, PALETTE.dustyRed], [790, PALETTE.mustard], [940, "#7aa85a"]].forEach(([x, color]) => {
      this.rect(x, 147, 145, 101, color, PALETTE.navy, 4);
      this.polygon([[x - 10, 147], [x + 72, 96], [x + 155, 147]], PALETTE.orangeBrown, PALETTE.navy, 4);
    });
    [[440, 158], [565, 158]].forEach(([x, y]) => {
      this.rect(x, y, 18, 128, PALETTE.brown, PALETTE.navy, 3);
      this.oval(x - 52, y - 70, 122, 92, "#3e773a", PALETTE.navy, 4);
    });
  }

  drawParkingLotBackground() {
    this.rect(0, 205, WIDTH, HEIGHT - 205, "#8d8c82");
    this.rect(0, 198, WIDTH, 40, "#59625e", PALETTE.navy, 4);
    for (let x = -20; x < WIDTH; x += 92) this.line([[x, 238], [x - 58, HEIGHT]], "#d9d0b8", 3);
    for (let x = 80; x < WIDTH; x += 180) {
      this.line([[x, 300], [x + 86, 300]], "#d9d0b8", 3);
      this.line([[x + 30, 430], [x + 116, 430]], "#d9d0b8", 3);
    }
    [[95, PALETTE.dustyRed], [220, PALETTE.sky], [770, PALETTE.mustard], [915, "#7aa85a"]].forEach(([x, color]) => {
      this.rect(x, 155, 88, 50, color, PALETTE.navy, 4);
      this.circle(x + 21, 205, 11, PALETTE.charcoal, PALETTE.navy, 2);
      this.circle(x + 69, 205, 11, PALETTE.charcoal, PALETTE.navy, 2);
    });
  }

  outfieldCurve(left, center, right, steps = 24) {
    const points = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = (1 - t) ** 2 * left[0] + 2 * (1 - t) * t * center[0] + t ** 2 * right[0];
      const y = (1 - t) ** 2 * left[1] + 2 * (1 - t) * t * center[1] + t ** 2 * right[1];
      points.push([x, y]);
    }
    return points;
  }

  drawPlayableField(field) {
    const home = [550, 642];
    const third = [322, 510];
    const second = [550, 375];
    const first = [778, 510];
    const left = field === "Parking Lot" ? [165, 395] : [158, 380];
    const center = field === "Parking Lot" ? [550, 250] : [550, 225];
    const right = field === "Parking Lot" ? [935, 395] : [942, 380];
    const curve = this.outfieldCurve(left, center, right);
    const grass = field === "Backyard" ? "#67994e" : field === "Parking Lot" ? "#8d8c82" : "#5f9b4d";
    const lineColor = field === "Parking Lot" ? "#eee0bd" : PALETTE.cream;
    const fan = [home, left, ...curve.slice(1, -1), right];
    this.polygon(fan, grass, PALETTE.navy, 5);
    this.line(curve, field === "Stadium" ? "#516b58" : lineColor, field === "Stadium" ? 6 : 3, field !== "Stadium");
    this.line([home, left], PALETTE.navy, 8);
    this.line([home, right], PALETTE.navy, 8);
    this.line([home, left], lineColor, 4);
    this.line([home, right], lineColor, 4);
    this.polygon([second, first, home, third], "#c58a4b", PALETTE.navy, 5);
    this.polygon([[550, 420], [704, 508], [550, 590], [396, 508]], grass);
    [home, third, second, first].forEach(([x, y]) => {
      this.polygon([[x, y - 13], [x + 13, y], [x, y + 13], [x - 13, y]], PALETTE.cream, PALETTE.navy, 3);
    });
    this.polygon([[513, 648], [587, 648], [573, 674], [527, 674]], lineColor, PALETTE.navy, 3);
  }

  baseMarkerPosition(baseIndex) {
    let positions = [[830, 474], [540, 374], [266, 474]];
    if (this.selectedField === "Parking Lot") {
      positions = [[855, 474], [540, 349], [241, 474]];
    } else if (this.selectedField === "Backyard") {
      positions = [[830, 459], [530, 349], [266, 459]];
    }
    return positions[baseIndex];
  }

  batterMarkerPosition() {
    return [this.batterSide === 1 ? 492 : 608, 660];
  }

  addOutMarker(x, y) {
    this.outMarkers.push([x, y]);
  }

  clearOutMarkers() {
    this.outMarkers = [];
    this.batterSide = Math.random() < 0.5 ? -1 : 1;
    if (this.screen === "game" && !this.rolling) {
      this.batterReaction = "ready";
      this.showGame();
    }
  }

  scheduleOutMarkerClear() {
    if (this.outMarkers.length || this.batterReaction === "out") setTimeout(() => this.clearOutMarkers(), 1000);
  }

  clearSimpleResult(token) {
    if (token !== this.simpleResultToken) return;
    this.simpleResult = "";
    if (this.screen === "game" && !this.rolling && !this.gameOver) this.showGame();
  }

  scheduleSimpleResultClear() {
    if (!this.simpleResult) return;
    this.simpleResultToken += 1;
    const token = this.simpleResultToken;
    setTimeout(() => this.clearSimpleResult(token), 2000);
  }

  scoreRun() {
    const side = this.offenseSide();
    this.ensureScoreSlots();
    this.teamStats[side].runs[this.inning - 1] += 1;
  }

  addHit() {
    this.teamStats[this.offenseSide()].hits += 1;
  }

  addError() {
    this.teamStats[this.defenseSide()].errors += 1;
  }

  addStrikeout() {
    this.teamStats[this.defenseSide()].strikeouts += 1;
  }

  advanceExistingRunners(bases = 1) {
    const newBases = [null, null, null];
    for (let i = 2; i >= 0; i -= 1) {
      const runner = this.bases[i];
      if (runner === null) continue;
      const target = i + bases;
      if (target >= 3) this.scoreRun();
      else newBases[target] = runner;
    }
    this.bases = newBases;
  }

  putBatterOn(baseIndex) {
    if (baseIndex >= 3) this.scoreRun();
    else this.bases[baseIndex] = "runner";
  }

  advanceWithBatter(runnerBases, batterBase, options = {}) {
    if (options.hit) this.addHit();
    if (options.error) this.addError();
    this.advanceExistingRunners(runnerBases);
    this.putBatterOn(batterBase);
  }

  walkBatter() {
    if (this.bases[0] !== null) {
      if (this.bases[1] !== null) {
        if (this.bases[2] !== null) this.scoreRun();
        this.bases[2] = this.bases[1];
      }
      this.bases[1] = this.bases[0];
    }
    this.bases[0] = "runner";
  }

  leadForcedBase() {
    if (this.bases[0] === null) return null;
    if (this.bases[1] !== null && this.bases[2] !== null) return 2;
    if (this.bases[1] !== null) return 1;
    return 0;
  }

  doublePlay() {
    const forced = this.leadForcedBase();
    this.addOutMarker(...this.batterMarkerPosition());
    if (forced !== null) {
      this.addOutMarker(...this.baseMarkerPosition(forced));
      this.bases[forced] = null;
      this.outs += 2;
    } else {
      this.outs += 1;
    }
  }

  forceOut() {
    const forced = this.leadForcedBase();
    if (forced === null) {
      this.addOutMarker(...this.batterMarkerPosition());
      this.outs += 1;
      if (this.outs < 3) this.advanceExistingRunners(1);
      return;
    }
    this.addOutMarker(...this.baseMarkerPosition(forced));
    if (forced === 2) {
      this.bases[2] = this.bases[1];
      this.bases[1] = this.bases[0];
    } else if (forced === 1) {
      this.bases[1] = this.bases[0];
    }
    this.bases[0] = "runner";
    this.outs += 1;
  }

  batterOutRunnersAdvance(bases = 0) {
    this.addOutMarker(...this.batterMarkerPosition());
    this.outs += 1;
    if (bases && this.outs < 3) this.advanceExistingRunners(bases);
  }

  currentRuleResult() {
    const dice = [...this.diceValues].sort((a, b) => a - b);
    const found = RULES.find(([combo]) => combo[0] === dice[0] && combo[1] === dice[1]);
    return found ? found[1] : "Unknown";
  }

  simplifiedResult(dice) {
    const runnersOn = this.bases.some((runner) => runner !== null);
    if (dice[0] === 1 && dice[1] === 1) return runnersOn ? "Deep Double" : "Double";
    if (dice[0] === 2 && dice[1] === 2) return runnersOn ? "Deep Double" : "Double";
    if (dice[0] === 3 && dice[1] === 3) return "Triple";
    if (dice[0] === 6 && dice[1] === 6) return "HomeRun";
    if (dice[0] === 2 && dice[1] === 4) return runnersOn ? "Deep Single" : "Single";
    if ([[1, 4], [5, 5], [1, 3], [4, 4]].some(([a, b]) => dice[0] === a && dice[1] === b)) return "Single";
    if ([[1, 6], [2, 5], [3, 4]].some(([a, b]) => dice[0] === a && dice[1] === b)) return "Strikeout";
    if ([[1, 2], [1, 5]].some(([a, b]) => dice[0] === a && dice[1] === b) && this.leadForcedBase() !== null) return "Double Play";
    return "Groundout";
  }

  resolvePlay() {
    if (this.gameOver) return;
    const dice = [...this.diceValues].sort((a, b) => a - b);
    this.lastResult = this.currentRuleResult();
    this.simpleResult = this.simplifiedResult(dice);
    this.outMarkers = [];
    this.batterReaction = "swing";
    this.teamStats[this.offenseSide()].batters += 1;
    const key = `${dice[0]},${dice[1]}`;
    if (key === "1,1") this.advanceWithBatter(2, 1, { hit: true });
    else if (key === "1,2" || key === "1,5") this.doublePlay();
    else if (key === "1,3") {
      this.walkBatter();
      this.batterReaction = "walk";
    } else if (key === "1,4") this.advanceWithBatter(1, 0, { hit: true });
    else if (key === "1,6" || key === "2,5" || key === "3,4") {
      this.addStrikeout();
      this.batterOutRunnersAdvance(0);
      this.batterReaction = "out";
    } else if (key === "2,2") this.advanceWithBatter(3, 1, { hit: true });
    else if (key === "2,3" || key === "5,6") {
      this.batterOutRunnersAdvance(0);
      this.batterReaction = "out";
    } else if (key === "2,4") this.advanceWithBatter(2, 0, { hit: true });
    else if (key === "2,6") this.forceOut();
    else if (key === "3,3") this.advanceWithBatter(3, 2, { hit: true });
    else if (key === "3,5") this.batterOutRunnersAdvance(1);
    else if (key === "3,6" || key === "4,5") {
      this.batterOutRunnersAdvance(0);
      this.batterReaction = "out";
    } else if (key === "4,4") this.advanceWithBatter(1, 0, { error: true });
    else if (key === "4,6") this.batterOutRunnersAdvance(1);
    else if (key === "5,5") this.advanceWithBatter(1, 0, { hit: true });
    else if (key === "6,6") this.advanceWithBatter(3, 3, { hit: true });
    this.checkWalkoffOrSwitch();
    if (this.outMarkers.length) this.scheduleOutMarkerClear();
    else this.batterSide = Math.random() < 0.5 ? -1 : 1;
    this.scheduleSimpleResultClear();
  }

  checkWalkoffOrSwitch() {
    if (this.half === "bottom" && this.inning >= this.selectedInnings && this.totalRuns("home") > this.totalRuns("away")) {
      this.finishGame("home");
      return;
    }
    if (this.outs < 3) return;
    this.bases = [null, null, null];
    this.outs = 0;
    this.batterReaction = "ready";
    if (this.half === "top") {
      if (this.inning >= this.selectedInnings && this.totalRuns("home") > this.totalRuns("away")) this.finishGame("home");
      else this.half = "bottom";
    } else if (this.inning >= this.selectedInnings && this.totalRuns("home") !== this.totalRuns("away")) {
      this.finishGame(this.totalRuns("home") > this.totalRuns("away") ? "home" : "away");
    } else {
      this.inning += 1;
      this.half = "top";
      this.ensureScoreSlots();
    }
  }

  finishGame(winningSide) {
    this.gameOver = true;
    this.gameActive = false;
    this.rolling = false;
    this.winner = this.teamName(winningSide);
    this.lastResult = "Final";
  }

  drawPlayers() {
    const [defenseMain, defenseSecondary] = this.teamColors(this.defenseSide());
    const [offenseMain, offenseSecondary] = this.teamColors(this.offenseSide());
    let thirdBaseX = 298;
    let shortstopX = 468;
    let secondBaseX = 632;
    let firstBaseX = 805;
    let pitcherY;
    let thirdBaseY;
    let shortstopY;
    let secondBaseY;
    let firstBaseY;
    if (this.selectedField === "Backyard") {
      pitcherY = 455;
      thirdBaseY = 415;
      shortstopY = 367;
      secondBaseY = 367;
      firstBaseY = 415;
    } else if (this.selectedField === "Parking Lot") {
      pitcherY = 455;
      thirdBaseX = 283;
      thirdBaseY = 425;
      shortstopX = 453;
      shortstopY = 377;
      secondBaseX = 647;
      secondBaseY = 377;
      firstBaseX = 820;
      firstBaseY = 425;
    } else {
      pitcherY = 470;
      thirdBaseY = 440;
      shortstopY = 392;
      secondBaseY = 392;
      firstBaseY = 440;
    }
    const positions = [
      ["outfielder", 270, 330, [60, 80], "right", "#6f432e", "#1b1715", "outfielder"],
      ["outfielder", 550, 285, [58, 76], "right", "#d89a68", "#6b3a1e", "outfielder"],
      ["outfielder", 830, 330, [60, 80], "left", "#9f6646", "#271b17", "outfielder"],
      ["infielder", thirdBaseX, thirdBaseY, [67, 88], "right", "#7a4a31", "#1d1512", "infielder"],
      ["infielder", shortstopX, shortstopY, [65, 86], "right", "#b9774f", "#332018", "infielder"],
      ["infielder", secondBaseX, secondBaseY, [65, 86], "left", "#f0b47a", "#5b321d", "infielder"],
      ["first_baseman", firstBaseX, firstBaseY, [70, 90], "left", "#c9875b", "#4a2c1c", "first"],
      ["pitcher", 550, pitcherY, [76, 100], "right", "#8b5a3c", "#2b1b16", "pitcher"],
      ["catcher", 550, 704, [78, 100], "right", "#5f3826", "#1b1715", "catcher"],
    ];
    positions.forEach(([role, x, y, size, facing, skin, hair, fallbackRole]) => {
      if (!this.drawSpriteCharacter(role, x, y, defenseMain, defenseSecondary, skin, hair, size, facing)) {
        this.drawPlayer(x, y, defenseMain, defenseSecondary, fallbackRole, skin, hair);
      }
    });
    const batterX = this.batterSide === 1 ? 492 : 608;
    const batterFacing = this.batterSide === 1 ? "right" : "left";
    const batterState = { swing: "swing", out: "out", walk: "walk" }[this.batterReaction] || "idle";
    if (!this.drawSpriteCharacter("batter", batterX, 660, offenseMain, offenseSecondary, "#b9774f", "#332018", [84, 112], batterFacing, batterState)) {
      this.drawBatter(batterX, 660, offenseMain, offenseSecondary);
    }
    let runnerPositions = [
      [830, 474, "second"],
      [540, 374, "third"],
      [266, 474, "home"],
    ];
    if (this.selectedField === "Parking Lot") {
      runnerPositions = [
        [855, 474, "second"],
        [540, 349, "third"],
        [241, 474, "home"],
      ];
    } else if (this.selectedField === "Backyard") {
      runnerPositions = [
        [830, 459, "second"],
        [530, 349, "third"],
        [266, 459, "home"],
      ];
    }
    runnerPositions.forEach(([x, y, direction], i) => {
      if (this.bases[i] === null) return;
      const facing = direction === "home" ? "right" : "left";
      if (!this.drawSpriteCharacter("runner", x, y, offenseMain, offenseSecondary, "#d89a68", "#3b2419", [68, 90], facing)) {
        this.drawRunner(x, y, offenseMain, offenseSecondary, direction);
      }
    });
    this.outMarkers.forEach(([x, y]) => this.text(x, y - 58, "X", PALETTE.dustyRed, 24));
  }

  drawPlayerCap(x, y, main, secondary, facing = 1) {
    let crown = [[x - 18, y], [x - 12, y - 12], [x + 8, y - 16], [x + 20, y - 8], [x + 18, y + 3], [x - 12, y + 5]];
    const brim = [[x + 8 * facing, y + 1], [x + 30 * facing, y + 3], [x + 22 * facing, y + 11], [x + 4 * facing, y + 8]];
    if (facing < 0) crown = crown.map(([px, py]) => [x - (px - x), py]);
    this.polygon(crown, main, PALETTE.navy, 3);
    this.polygon(brim, secondary, PALETTE.navy, 3);
    this.polygon([[x - 11, y - 2], [x - 5, y - 10], [x + 5, y - 12], [x, y + 2]], this.shade(main, 0.18));
  }

  drawJersey(x, y, main, secondary, width = 38, height = 40, lean = 0) {
    const left = x - Math.floor(width / 2) + lean;
    const right = x + Math.floor(width / 2) + lean;
    const top = y;
    const bottom = y + height;
    this.polygon([[left, top + 6], [x - 8 + lean, top], [x + 8 + lean, top], [right, top + 6], [right - 4, bottom], [left + 4, bottom]], main, PALETTE.navy, 4);
    this.polygon([[left - 12, top + 8], [left + 4, top + 5], [left + 8, top + 20], [left - 8, top + 24]], secondary, PALETTE.navy, 3);
    this.polygon([[right + 12, top + 8], [right - 4, top + 5], [right - 8, top + 20], [right + 8, top + 24]], secondary, PALETTE.navy, 3);
    this.polygon([[x - 11 + lean, top + 1], [x, top + 12], [x + 11 + lean, top + 1], [x + 6 + lean, top], [x, top + 6], [x - 6 + lean, top]], PALETTE.cream, PALETTE.navy, 2);
    this.line([[x + lean, top + 12], [x + lean, bottom - 4]], PALETTE.cream, 3);
    [top + 19, top + 29].forEach((buttonY) => this.rect(x - 2 + lean, buttonY, 4, 3, secondary));
    this.polygon([[left + 4, bottom], [x - 3 + lean, bottom], [x - 8 + lean, bottom + 17], [left + 6, bottom + 17]], PALETTE.cream, PALETTE.navy, 3);
    this.polygon([[x + 3 + lean, bottom], [right - 4, bottom], [right - 6, bottom + 17], [x + 8 + lean, bottom + 17]], PALETTE.cream, PALETTE.navy, 3);
  }

  drawPlayer(x, y, main, secondary, role, skin, hair) {
    if (role === "pitcher") {
      this.oval(x - 28, y - 8, 56, 22, "#b97f4b", PALETTE.navy, 3);
      this.line([[x + 8, y - 10], [x + 30, y - 35]], PALETTE.navy, 5);
      this.oval(x + 26, y - 42, 12, 12, PALETTE.cream, PALETTE.navy, 2);
    } else if (role === "catcher") {
      this.rect(x - 20, y - 18, 40, 36, secondary, PALETTE.navy, 4);
      this.line([[x - 18, y + 10], [x - 36, y + 30]], PALETTE.navy, 5);
      this.line([[x + 18, y + 10], [x + 36, y + 30]], PALETTE.navy, 5);
      this.oval(x - 30, y - 48, 60, 50, main, PALETTE.navy, 4);
      this.line([[x - 18, y - 28], [x + 18, y - 28]], PALETTE.cream, 3);
      this.line([[x - 16, y - 16], [x + 16, y - 16]], PALETTE.cream, 3);
      return;
    } else if (role === "first") {
      this.oval(x - 48, y - 5, 24, 27, PALETTE.brown, PALETTE.navy, 3);
    } else if (role === "infielder") {
      this.oval(x + 24, y + 2, 24, 23, PALETTE.brown, PALETTE.navy, 3);
    } else {
      this.oval(x + 20, y - 3, 24, 23, PALETTE.brown, PALETTE.navy, 3);
    }
    this.drawJersey(x, y - 14, main, secondary, 40, 38);
    this.oval(x - 16, y - 45, 32, 32, skin, PALETTE.navy, 3);
    this.rect(x - 14, y - 48, 28, 12, hair, PALETTE.navy, 2);
    this.drawPlayerCap(x, y - 50, main, secondary, x < 550 ? 1 : -1);
  }

  drawBatter(x, y, main, secondary) {
    const d = this.batterSide;
    this.line([[x + 18 * d, y - 55], [x + 66 * d, y - 88]], PALETTE.navy, 8);
    this.line([[x + 18 * d, y - 55], [x + 66 * d, y - 88]], PALETTE.brown, 5);
    this.drawJersey(x + 2 * d, y - 20, main, secondary, 42, 42, 3 * d);
    this.line([[x - 16 * d, y - 6], [x + 24 * d, y - 47]], PALETTE.navy, 6);
    this.line([[x + 3 * d, y - 8], [x + 25 * d, y - 49]], PALETTE.navy, 6);
    this.oval(x + 18 * d - 7, y - 61, 14, 14, PALETTE.cream, PALETTE.navy, 2);
    this.oval(x - 17, y - 56, 34, 33, "#b9774f", PALETTE.navy, 3);
    if (d === 1) this.rect(x - 18, y - 39, 24, 8, "#3b2419");
    else this.rect(x - 6, y - 39, 24, 8, "#3b2419");
    this.drawPlayerCap(x, y - 61, main, secondary, d);
    if (this.batterReaction === "walk") this.text(x - 5, y - 88, "!", PALETTE.mustard, 18);
    else if (this.batterReaction === "out") this.text(x - 10, y - 88, "X", PALETTE.dustyRed, 16);
  }

  drawRunner(x, y, main, secondary, direction) {
    const lean = { second: -16, third: -18, home: 16 }[direction];
    this.drawJersey(x + Math.floor(lean / 4), y - 18, main, secondary, 36, 38, Math.floor(lean / 5));
    this.oval(x - 14, y - 46, 30, 30, "#d89a68", PALETTE.navy, 3);
    this.drawPlayerCap(x, y - 51, main, secondary, lean < 0 ? -1 : 1);
    this.line([[x + 12, y - 4], [x + lean + 28, y - 12]], PALETTE.navy, 5);
  }

  drawVictoryOverlay() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.75;
    this.rect(0, 0, WIDTH, HEIGHT, PALETTE.navy);
    ctx.restore();
    this.panel(255, 190, 845, 500, PALETTE.card, PALETTE.navy, 8);
    [[310, 245, PALETTE.mustard], [780, 250, PALETTE.dustyRed], [390, 440, PALETTE.sky], [715, 430, PALETTE.grass], [548, 230, PALETTE.orangeBrown]].forEach(([x, y, color]) => {
      this.text(x, y, "*", color, 32);
    });
    this.titleText(550, 300, `${this.winner} Wins!`, 34);
    this.text(550, 358, `Final: ${this.teamName("away")} ${this.totalRuns("away")} - ${this.teamName("home")} ${this.totalRuns("home")}`, PALETTE.navy, 16);
    this.button(410, 405, 690, 470, "Return Home", () => this.returnToSetupAfterGame(), PALETTE.dustyRed);
  }

  drawScoreboard() {
    this.ensureScoreSlots();
    const home = this.teamName("home");
    const away = this.teamName("away");
    this.panel(145, 52, 985, 194, PALETTE.card, PALETTE.navy, 6);
    const halfText = this.half === "top" ? "TOP" : "BOT";
    this.text(560, 76, "SCOREBOARD", PALETTE.dustyRed, 18);
    this.text(800, 76, `${halfText} ${this.inning}`, PALETTE.navy, 13);
    this.text(872, 76, "OUTS", PALETTE.navy, 11);
    for (let i = 0; i < 3; i += 1) {
      this.circle(917 + i * 20, 74, 7, i < this.outs ? PALETTE.dustyRed : PALETTE.cream, PALETTE.navy, 2);
    }
    const visible = 7;
    const startInning = Math.max(1, this.inning - visible + 1);
    const innings = Array.from({ length: visible }, (_, i) => startInning + i);
    const teamX = 188;
    const dividerX = 430;
    const inningXs = Array.from({ length: visible }, (_, i) => 470 + i * 38);
    const totalXs = { R: 768, H: 832, E: 896 };
    this.line([[dividerX, 102], [dividerX, 184]], PALETTE.brown, 3);
    this.line([[748, 102], [748, 184]], PALETTE.brown, 3);
    this.line([[166, 130], [965, 130]], PALETTE.brown, 2);
    this.line([[166, 160], [965, 160]], "#e3c78f", 2);
    this.text(teamX, 116, "TEAM", PALETTE.navy, 11, { align: "left" });
    innings.forEach((inningNum, i) => this.text(inningXs[i], 116, String(inningNum), PALETTE.navy, 11));
    Object.entries(totalXs).forEach(([label, x]) => this.text(x, 116, label, PALETTE.navy, 11));
    [[148, "away", away], [178, "home", home]].forEach(([rowY, side, team]) => {
      this.text(teamX, rowY, team, PALETTE.charcoal, team.length > 12 ? 10 : 11, { align: "left" });
      innings.forEach((inningNum, i) => {
        const runs = inningNum <= this.teamStats[side].runs.length ? this.teamStats[side].runs[inningNum - 1] : "";
        this.text(inningXs[i], rowY, String(runs), PALETTE.charcoal, 11);
      });
      this.text(totalXs.R, rowY, String(this.totalRuns(side)), PALETTE.charcoal, 11);
      this.text(totalXs.H, rowY, String(this.teamStats[side].hits), PALETTE.charcoal, 11);
      this.text(totalXs.E, rowY, String(this.teamStats[side].errors), PALETTE.charcoal, 11);
    });
    this.drawStrikeoutCounter();
  }

  kTextLayout(count) {
    if (count <= 0) return [[], 18];
    const perLine = count <= 10 ? 5 : 6;
    const rows = [];
    for (let i = 0; i < count; i += perLine) rows.push("K".repeat(Math.min(perLine, count - i)));
    const fontSize = Math.max(8, Math.min(18, Math.floor(42 / rows.length)));
    return [rows, fontSize];
  }

  drawStrikeoutCounter() {
    this.panel(990, 52, 1090, 194, PALETTE.card, PALETTE.navy, 6);
    this.text(1040, 74, "K COUNT", PALETTE.dustyRed, 10);
    this.line([[1002, 96], [1078, 96]], PALETTE.brown, 2);
    this.line([[1002, 145], [1078, 145]], "#e3c78f", 2);
    [[121, "away", "A"], [170, "home", "H"]].forEach(([rowY, side, label]) => {
      this.text(1008, rowY, label, PALETTE.navy, 10, { align: "left" });
      const [rows, fontSize] = this.kTextLayout(this.teamStats[side].strikeouts);
      rows.forEach((row, i) => this.text(1048, rowY - ((rows.length - 1) * fontSize) / 2 + i * fontSize, row, "#b83032", fontSize));
    });
  }

  drawDiceArea() {
    if (this.simpleResult) {
      this.panel(895, 458, 1070, 497, PALETTE.mustard, PALETTE.navy, 4);
      this.text(982, 478, this.simpleResult, PALETTE.navy, 13);
    }
    this.panel(895, 500, 1070, 705, PALETTE.card, PALETTE.navy, 5);
    this.text(982, 526, "DICE", PALETTE.dustyRed, 18);
    this.drawDie(922, 552, 58, this.diceValues[0]);
    this.drawDie(995, 552, 58, this.diceValues[1]);
    const label = this.gameOver ? "Final" : this.rolling ? "Rolling..." : "Roll Dice";
    const action = this.rolling || this.gameOver ? () => {} : () => this.rollDice();
    this.button(913, 640, 1057, 690, label, action, PALETTE.dustyRed);
  }

  rollDice() {
    if (this.rolling || this.gameOver) return;
    this.rolling = true;
    this.showGame();
    this.animateRoll(8);
  }

  animateRoll(frames) {
    if (this.screen !== "game") {
      this.rolling = false;
      return;
    }
    this.diceValues = [this.randomDie(), this.randomDie()];
    this.showGame();
    if (frames <= 1) {
      this.rolling = false;
      this.resolvePlay();
      this.showGame();
      return;
    }
    setTimeout(() => this.animateRoll(frames - 1), 45);
  }

  randomDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  drawDie(x, y, size, value) {
    this.rect(x + 2, y + 2, size, size, "#c5a372");
    this.rect(x, y, size, size, PALETTE.cream, PALETTE.navy, 2);
    const dotPositions = {
      1: [[0.5, 0.5]],
      2: [[0.28, 0.28], [0.72, 0.72]],
      3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
      4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
      5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
      6: [[0.28, 0.25], [0.72, 0.25], [0.28, 0.5], [0.72, 0.5], [0.28, 0.75], [0.72, 0.75]],
    };
    const r = Math.max(2, Math.floor(size / 10));
    dotPositions[value].forEach(([px, py]) => {
      const cx = x + size * px;
      const cy = y + size * py;
      this.rect(cx - r, cy - r, r * 2, r * 2, PALETTE.charcoal);
    });
  }

  hatPoint(cx, cy, scale, direction, [x, y]) {
    const flip = direction === "left" ? -1 : 1;
    return [cx + x * scale * flip, cy + y * scale];
  }

  drawHat(cx, cy, main, secondary, letters, scale, direction = "right") {
    const p = (points) => points.map((point) => this.hatPoint(cx, cy, scale, direction, point));
    const thick = Math.max(4, Math.floor(6 * scale));
    const thin = Math.max(2, Math.floor(2 * scale));
    const highlight = this.shade(secondary, 0.24);
    const shadow = this.shade(secondary, -0.28);
    const brimShadow = this.shade(main, -0.22);
    const crown = [[-75, 8], [-68, -30], [-42, -56], [4, -66], [44, -54], [68, -25], [75, 8], [61, 34], [16, 45], [-38, 39], [-69, 23]];
    const frontPanel = [[12, -56], [47, -48], [68, -21], [68, 12], [55, 32], [18, 41], [4, -10]];
    const crownHighlight = [[-56, -4], [-43, -32], [-18, -51], [5, -58], [2, -17], [-16, 25], [-48, 22]];
    const lowerShadow = [[-66, 15], [-35, 32], [7, 38], [53, 30], [43, 42], [8, 50], [-39, 44], [-72, 25]];
    const brim = [[-22, 23], [18, 17], [64, 18], [104, 27], [122, 38], [112, 50], [67, 56], [16, 50], [-28, 37]];
    this.polygon(p(crown), secondary, PALETTE.navy, thick);
    this.polygon(p(crownHighlight), highlight);
    this.polygon(p(lowerShadow), shadow);
    this.polygon(p(frontPanel), this.shade(secondary, 0.08), PALETTE.navy, thin);
    this.polygon(p(brim), main, PALETTE.navy, thick);
    this.polygon(p([[12, 43], [64, 48], [112, 46], [122, 38], [112, 50], [67, 56], [16, 50]]), brimShadow);
    const letterX = cx + (direction === "right" ? 38 : -38) * scale;
    this.text(letterX + 3 * scale, cy - 2 * scale, letters, PALETTE.navy, Math.floor(45 * scale));
    this.text(letterX, cy - 5 * scale, letters, PALETTE.cream, Math.floor(45 * scale));
  }
}

window.addEventListener("load", () => {
  new DiceBaseballWeb();
});
