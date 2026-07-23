import math
import random
import tkinter as tk

WIDTH = 1100
HEIGHT = 720

PALETTE = {
    "cream": "#f6e7c8",
    "mustard": "#d6a33a",
    "grass": "#548b45",
    "dusty_red": "#b7473f",
    "sky": "#78aac4",
    "orange_brown": "#a85f2e",
    "navy": "#202f4f",
    "charcoal": "#30313a",
    "brown": "#5b3a29",
    "card": "#fff0ce",
    "shadow": "#c68a45",
}

COLOR_MAP = {
    "red": "#b83032",
    "black": "#22242a",
    "navy": "#1e2f54",
    "orange": "#d36d28",
    "blue": "#2e67b1",
    "silver": "#b8b8aa",
    "purple": "#6b4a9e",
    "royal blue": "#2b63bd",
    "gold": "#d1a735",
    "gray": "#8f8f86",
    "green": "#3d7a52",
    "brown": "#7a4b2a",
    "teal": "#248a8b",
    "light blue": "#7fb7d6",
}

TEAMS = [
    ("Anaheim", "green", "gold"),
    ("Arizona", "red", "black"),
    ("Atlanta", "navy", "red"),
    ("Baltimore", "orange", "black"),
    ("Boston", "red", "navy"),
    ("Chicago", "blue", "red"),
    ("Chicago", "black", "silver"),
    ("Cincinnati", "red", "black"),
    ("Cleveland", "navy", "red"),
    ("Colorado", "purple", "black"),
    ("Detroit", "navy", "orange"),
    ("Houston", "navy", "orange"),
    ("Kansas City", "royal blue", "gold"),
    ("Los Angeles", "red", "navy"),
    ("Los Angeles", "blue", "red"),
    ("Miami", "black", "blue"),
    ("Milwaukee", "navy", "gold"),
    ("Minnesota", "navy", "red"),
    ("New York", "blue", "orange"),
    ("New York", "navy", "gray"),
    ("Philadelphia", "red", "blue"),
    ("Pittsburgh", "black", "gold"),
    ("San Diego", "brown", "gold"),
    ("San Francisco", "orange", "black"),
    ("Seattle", "navy", "teal"),
    ("St. Louis", "red", "navy"),
    ("Tampa Bay", "navy", "light blue"),
    ("Texas", "blue", "red"),
    ("Toronto", "blue", "red"),
    ("Washington", "red", "navy"),
]

RULES = [
    ((1, 1), "Double (2)"),
    ((1, 2), "Ground Out (DP)"),
    ((1, 3), "Walk"),
    ((1, 4), "Single (1)"),
    ((1, 5), "Ground Out (DP)"),
    ((1, 6), "Strikeout"),
    ((2, 2), "Double (3)"),
    ((2, 3), "Pop Out"),
    ((2, 4), "Single (2)"),
    ((2, 5), "Strikeout"),
    ((2, 6), "Ground Out (FO)"),
    ((3, 3), "Triple"),
    ((3, 4), "Strikeout"),
    ((3, 5), "Ground Out (FC)"),
    ((3, 6), "Fly Out"),
    ((4, 4), "Error (1)"),
    ((4, 5), "Fly Out"),
    ((4, 6), "Fly Out (SAC)"),
    ((5, 5), "Single (1)"),
    ((5, 6), "Pop Out"),
    ((6, 6), "Home run"),
]

NOTES = [
    "(DP) Double Play on lead runner and batter if a force available. If no force, runners do not advance.",
    "(FC) Fielders choice, batter out, runners advance 1 base.",
    "(FO) Force out, lead runner out if force available. If not force, batter out, runners advance 1 base.",
    "(1) Other runners advance 1 base   (2) Other runners advance 2 bases   (3) Other runners advance 3 bases",
]

CAP_LETTERS = {
    "New York": "NY",
    "Los Angeles": "LA",
    "San Francisco": "SF",
    "St. Louis": "SL",
}


class DiceBaseballApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Dice Baseball 8-Bit")
        self.root.resizable(False, False)
        self.canvas = tk.Canvas(self.root, width=WIDTH, height=HEIGHT, bg=PALETTE["sky"], highlightthickness=0)
        self.canvas.pack()
        self.clickables = []
        self.home_index = self.team_index("Pittsburgh", "black", "gold")
        self.away_index = self.team_index("Cincinnati", "red", "black")
        self.selected_innings = 3
        self.selected_field = "Stadium"
        self.dice_values = (1, 1)
        self.rolling = False
        self.game_active = False
        self.game_over = False
        self.winner = None
        self.screen = "home"
        self.canvas.bind("<Button-1>", self.on_click)
        self.show_home()

    def team_index(self, name, main, secondary):
        for i, team in enumerate(TEAMS):
            if team == (name, main, secondary):
                return i
        return 0

    def clear(self):
        self.canvas.delete("all")
        self.clickables = []

    def reset_game_state(self):
        self.game_active = True
        self.game_over = False
        self.winner = None
        self.inning = 1
        self.half = "top"
        self.outs = 0
        self.bases = [None, None, None]
        self.batter_reaction = "ready"
        self.batter_side = random.choice([-1, 1])
        self.last_result = "Roll to begin"
        self.simple_result = ""
        self.simple_result_token = 0
        self.out_markers = []
        self.dice_values = (1, 1)
        self.team_stats = {
            "away": {"runs": [], "hits": 0, "errors": 0, "batters": 0},
            "home": {"runs": [], "hits": 0, "errors": 0, "batters": 0},
        }
        self.ensure_score_slots()

    def ensure_score_slots(self):
        for side in ["away", "home"]:
            while len(self.team_stats[side]["runs"]) < self.inning:
                self.team_stats[side]["runs"].append(0)

    def add_clickable(self, x1, y1, x2, y2, action):
        self.clickables.append((x1, y1, x2, y2, action))

    def on_click(self, event):
        for x1, y1, x2, y2, action in reversed(self.clickables):
            if x1 <= event.x <= x2 and y1 <= event.y <= y2:
                action()
                return

    def draw_background(self):
        self.canvas.create_rectangle(0, 0, WIDTH, HEIGHT, fill=PALETTE["sky"], outline="")
        self.canvas.create_rectangle(0, 452, WIDTH, HEIGHT, fill=PALETTE["grass"], outline="")
        self.canvas.create_polygon(0, 500, 180, 430, 340, 488, 530, 420, 720, 478, 910, 425, WIDTH, 490, WIDTH, HEIGHT, 0, HEIGHT, fill="#5f974b", outline="")
        for x in range(30, WIDTH, 95):
            self.canvas.create_rectangle(x, 392, x + 14, 465, fill="#704820", outline=PALETTE["brown"], width=2)
            self.canvas.create_oval(x - 30, 340, x + 45, 415, fill="#477b3e", outline=PALETTE["navy"], width=3)
        self.canvas.create_polygon(175, 470, 550, 335, 925, 470, 790, 610, 310, 610, fill="#cf9a5a", outline=PALETTE["brown"], width=5)
        self.canvas.create_polygon(550, 355, 625, 430, 550, 505, 475, 430, fill=PALETTE["cream"], outline=PALETTE["brown"], width=4)

    def panel(self, x1, y1, x2, y2, fill=PALETTE["card"], outline=PALETTE["navy"], width=5):
        points = [x1 + 8, y1, x2 - 14, y1 + 4, x2, y1 + 12, x2 - 5, y2 - 8, x2 - 18, y2, x1 + 10, y2 - 3, x1, y2 - 15, x1 + 4, y1 + 11]
        self.canvas.create_polygon(points, fill=fill, outline=outline, width=width, joinstyle=tk.ROUND)

    def button(self, x1, y1, x2, y2, text, action, fill=PALETTE["mustard"], selected=False):
        color = PALETTE["dusty_red"] if selected else fill
        self.panel(x1, y1, x2, y2, color, PALETTE["brown"], 4)
        self.canvas.create_text((x1 + x2) // 2 + 2, (y1 + y2) // 2 + 2, text=text, fill="#795020", font=("Courier", 20, "bold"))
        self.canvas.create_text((x1 + x2) // 2, (y1 + y2) // 2, text=text, fill=PALETTE["cream"], font=("Courier", 20, "bold"))
        self.add_clickable(x1, y1, x2, y2, action)

    def title_text(self, x, y, text, size=44):
        self.canvas.create_text(x + 4, y + 4, text=text, fill=PALETTE["brown"], font=("Courier", size, "bold"))
        self.canvas.create_text(x, y, text=text, fill=PALETTE["dusty_red"], font=("Courier", size, "bold"))
        self.canvas.create_text(x, y - 6, text=text, fill=PALETTE["mustard"], font=("Courier", size, "bold"))

    def show_home(self):
        self.screen = "home"
        self.clear()
        self.draw_background()
        self.panel(240, 80, 860, 255, PALETTE["card"], PALETTE["navy"], 7)
        self.title_text(550, 145, "DICE BASEBALL", 46)
        self.canvas.create_text(550, 210, text="Neighborhood tabletop baseball", fill=PALETTE["navy"], font=("Courier", 19, "bold"))
        self.draw_baseball_card(120, 108, "HOME", "#b83032", "#1e2f54")
        self.draw_baseball_card(910, 108, "AWAY", "#2b63bd", "#d1a735")
        self.button(410, 330, 690, 405, "Play Ball", self.show_setup, PALETTE["dusty_red"])
        self.button(410, 430, 690, 505, "Rules", self.show_rules, PALETTE["mustard"])

    def draw_baseball_card(self, x, y, label, main, secondary):
        self.panel(x, y, x + 130, y + 180, PALETTE["cream"], PALETTE["brown"], 4)
        self.draw_hat(x + 65, y + 85, main, secondary, label[0], 0.55)
        self.canvas.create_text(x + 65, y + 153, text=label, fill=PALETTE["navy"], font=("Courier", 16, "bold"))

    def show_rules(self):
        self.screen = "rules"
        self.clear()
        self.canvas.create_rectangle(0, 0, WIDTH, HEIGHT, fill=PALETTE["cream"], outline="")
        self.canvas.create_rectangle(0, 0, WIDTH, 82, fill=PALETTE["sky"], outline=PALETTE["navy"], width=4)
        self.button(28, 18, 270, 62, "Return to Home", self.show_home, PALETTE["orange_brown"])
        self.title_text(635, 42, "RULES", 32)
        self.panel(42, 94, 1058, 625, PALETTE["card"], PALETTE["navy"], 5)
        self.canvas.create_text(260, 122, text="DICE", fill=PALETTE["dusty_red"], font=("Courier", 18, "bold"))
        self.canvas.create_text(625, 122, text="RESULT", fill=PALETTE["dusty_red"], font=("Courier", 18, "bold"))
        y = 148
        for i, (dice, result) in enumerate(RULES):
            row_fill = "#f9e2b4" if i % 2 == 0 else "#efd49f"
            self.canvas.create_rectangle(64, y - 11, 1036, y + 12, fill=row_fill, outline="")
            self.draw_die(222, y - 10, 20, dice[0])
            self.draw_die(256, y - 10, 20, dice[1])
            self.canvas.create_text(325, y, text="{}/{}".format(dice[0], dice[1]), anchor="w", fill=PALETTE["navy"], font=("Courier", 14, "bold"))
            self.canvas.create_text(520, y, text=result, anchor="w", fill=PALETTE["charcoal"], font=("Courier", 14, "bold"))
            y += 23
        note_y = 646
        for note in NOTES:
            self.canvas.create_text(550, note_y, text=note, fill=PALETTE["brown"], font=("Courier", 11, "bold"))
            note_y += 17

    def show_setup(self):
        self.screen = "setup"
        self.clear()
        self.draw_background()
        self.title_text(550, 48, "SELECT GAME", 36)
        self.button(28, 18, 228, 62, "Return Home", self.show_home, PALETTE["orange_brown"])
        self.team_selector(45, 122, "Home", self.home_index, self.change_home, "right")
        self.team_selector(785, 122, "Away", self.away_index, self.change_away, "left")
        self.panel(330, 120, 770, 610, PALETTE["card"], PALETTE["navy"], 6)
        self.canvas.create_text(550, 168, text="Game Innings", fill=PALETTE["dusty_red"], font=("Courier", 20, "bold"))
        xs = [382, 482, 582, 682]
        for x, inning in zip(xs, [3, 5, 7, 9]):
            self.button(x - 36, 202, x + 36, 258, str(inning), lambda n=inning: self.set_innings(n), PALETTE["mustard"], self.selected_innings == inning)
        self.canvas.create_text(550, 318, text="Select Field", fill=PALETTE["dusty_red"], font=("Courier", 20, "bold"))
        fields = [("Stadium", 390), ("Backyard", 550), ("Parking Lot", 710)]
        for field, x in fields:
            self.button(x - 72, 352, x + 72, 408, field, lambda f=field: self.set_field(f), PALETTE["grass"], self.selected_field == field)
        self.button(410, 505, 690, 580, "Play Ball", self.start_game, PALETTE["dusty_red"])

    def start_game(self):
        self.reset_game_state()
        self.show_game()

    def end_game_to_home(self):
        self.game_active = False
        self.game_over = False
        self.winner = None
        self.show_home()

    def return_to_setup_after_game(self):
        self.game_active = False
        self.game_over = False
        self.winner = None
        self.show_setup()

    def show_game(self):
        if not hasattr(self, "inning"):
            self.reset_game_state()
        self.screen = "game"
        self.clear()
        self.draw_field_scene(self.selected_field)
        self.draw_players()
        self.draw_scoreboard()
        self.button(20, 18, 170, 62, "End Game", self.end_game_to_home, PALETTE["orange_brown"])
        self.draw_dice_area()
        if self.game_over:
            self.draw_victory_overlay()

    def draw_field_scene(self, field):
        if field == "Backyard":
            self.draw_backyard_field()
        elif field == "Parking Lot":
            self.draw_parking_lot_field()
        else:
            self.draw_stadium_field()
        self.draw_playable_field(field)
        self.canvas.create_text(550, 33, text=field.upper(), fill=PALETTE["cream"], font=("Courier", 24, "bold"))

    def draw_sky(self):
        self.canvas.create_rectangle(0, 0, WIDTH, HEIGHT, fill=PALETTE["sky"], outline="")
        for x, y in [(180, 78), (780, 70), (965, 120)]:
            self.canvas.create_oval(x, y, x + 56, y + 28, fill=PALETTE["cream"], outline=PALETTE["navy"], width=2)
            self.canvas.create_oval(x + 32, y - 12, x + 88, y + 30, fill=PALETTE["cream"], outline=PALETTE["navy"], width=2)
            self.canvas.create_rectangle(x + 20, y + 12, x + 76, y + 30, fill=PALETTE["cream"], outline="")

    def draw_stadium_field(self):
        self.draw_sky()
        self.canvas.create_rectangle(0, 245, WIDTH, HEIGHT, fill="#5f9b4d", outline="")
        self.canvas.create_rectangle(68, 170, 1032, 260, fill="#d8c178", outline=PALETTE["navy"], width=5)
        for x in range(96, 1000, 42):
            color = PALETTE["dusty_red"] if (x // 42) % 2 == 0 else PALETTE["mustard"]
            self.canvas.create_rectangle(x, 190, x + 25, 232, fill=color, outline=PALETTE["brown"], width=2)
            self.canvas.create_oval(x + 2, 178, x + 22, 195, fill="#f0dca6", outline=PALETTE["brown"], width=1)
        self.canvas.create_rectangle(438, 116, 662, 170, fill=PALETTE["navy"], outline=PALETTE["cream"], width=4)
        self.canvas.create_text(550, 139, text="DICE PARK", fill=PALETTE["mustard"], font=("Courier", 17, "bold"))
        self.canvas.create_text(550, 160, text="0 0 0", fill=PALETTE["cream"], font=("Courier", 11, "bold"))
        for x in [105, 995]:
            self.canvas.create_rectangle(x, 82, x + 14, 255, fill=PALETTE["cream"], outline=PALETTE["navy"], width=3)
            self.canvas.create_oval(x - 18, 60, x + 32, 90, fill=PALETTE["mustard"], outline=PALETTE["navy"], width=3)
        for x in range(340, 760, 48):
            self.canvas.create_polygon(x, 176, x + 31, 186, x, 197, fill=PALETTE["dusty_red"], outline=PALETTE["navy"], width=2)
        self.canvas.create_rectangle(55, 258, 1045, 302, fill="#516b58", outline=PALETTE["navy"], width=5)
        for x in [235, 815]:
            self.canvas.create_rectangle(x, 282, x + 135, 325, fill=PALETTE["orange_brown"], outline=PALETTE["navy"], width=4)
            self.canvas.create_polygon(x, 282, x + 68, 254, x + 135, 282, fill=PALETTE["dusty_red"], outline=PALETTE["navy"], width=4)

    def draw_backyard_field(self):
        self.draw_sky()
        self.canvas.create_rectangle(0, 245, WIDTH, HEIGHT, fill="#67994e", outline="")
        for x in range(0, WIDTH, 72):
            self.canvas.create_rectangle(x, 235, x + 42, 276, fill=PALETTE["cream"], outline=PALETTE["brown"], width=3)
        for x, color in [(70, PALETTE["dusty_red"]), (790, PALETTE["mustard"]), (940, "#7aa85a")]:
            self.canvas.create_rectangle(x, 147, x + 145, 248, fill=color, outline=PALETTE["navy"], width=4)
            self.canvas.create_polygon(x - 10, 147, x + 72, 96, x + 155, 147, fill=PALETTE["orange_brown"], outline=PALETTE["navy"], width=4)
            self.canvas.create_rectangle(x + 22, 177, x + 62, 218, fill=PALETTE["sky"], outline=PALETTE["navy"], width=2)
        self.canvas.create_rectangle(258, 204, 356, 270, fill=PALETTE["orange_brown"], outline=PALETTE["navy"], width=4)
        self.canvas.create_polygon(250, 204, 307, 164, 365, 204, fill=PALETTE["brown"], outline=PALETTE["navy"], width=4)
        self.canvas.create_rectangle(648, 194, 714, 252, fill=PALETTE["dusty_red"], outline=PALETTE["navy"], width=3)
        self.canvas.create_oval(666, 216, 698, 243, fill=PALETTE["cream"], outline=PALETTE["navy"], width=2)
        for x in [440, 565]:
            self.canvas.create_rectangle(x, 158, x + 18, 286, fill=PALETTE["brown"], outline=PALETTE["navy"], width=3)
            self.canvas.create_oval(x - 52, 88, x + 70, 180, fill="#3e773a", outline=PALETTE["navy"], width=4)
        self.canvas.create_line(458, 188, 574, 204, fill=PALETTE["navy"], width=3)
        self.canvas.create_oval(512, 211, 550, 251, fill="", outline=PALETTE["cream"], width=5)
        self.canvas.create_oval(850, 285, 955, 335, fill="#69afca", outline=PALETTE["navy"], width=4)
        self.canvas.create_oval(120, 312, 156, 334, fill=PALETTE["dusty_red"], outline=PALETTE["navy"], width=3)
        self.canvas.create_line(275, 178, 350, 192, fill=PALETTE["cream"], width=3)
        for x in range(286, 345, 15):
            self.canvas.create_rectangle(x, 190, x + 6, 202, fill=PALETTE["cream"], outline=PALETTE["navy"], width=1)

    def draw_parking_lot_field(self):
        self.draw_sky()
        self.canvas.create_rectangle(0, 205, WIDTH, HEIGHT, fill="#8d8c82", outline="")
        self.canvas.create_rectangle(0, 198, WIDTH, 238, fill="#59625e", outline=PALETTE["navy"], width=4)
        for x in range(-20, WIDTH, 92):
            self.canvas.create_line(x, 238, x - 58, HEIGHT, fill="#d9d0b8", width=3)
        for x in range(80, WIDTH, 180):
            self.canvas.create_line(x, 300, x + 86, 300, fill="#d9d0b8", width=3)
            self.canvas.create_line(x + 30, 430, x + 116, 430, fill="#d9d0b8", width=3)
        for x, color in [(95, PALETTE["dusty_red"]), (220, PALETTE["sky"]), (770, PALETTE["mustard"]), (915, "#7aa85a")]:
            self.canvas.create_rectangle(x, 155, x + 88, 205, fill=color, outline=PALETTE["navy"], width=4)
            self.canvas.create_oval(x + 10, 194, x + 32, 216, fill=PALETTE["charcoal"], outline=PALETTE["navy"], width=2)
            self.canvas.create_oval(x + 58, 194, x + 80, 216, fill=PALETTE["charcoal"], outline=PALETTE["navy"], width=2)
        for x in range(58, 1045, 58):
            self.canvas.create_rectangle(x, 188, x + 8, 255, fill="#b9c2b1", outline=PALETTE["navy"], width=2)
            self.canvas.create_line(x + 8, 198, x + 30, 222, fill=PALETTE["navy"], width=2)
        for x, y in [(210, 555), (872, 430), (148, 360), (958, 590)]:
            self.canvas.create_polygon(x, y, x + 25, y, x + 32, y + 48, x - 8, y + 48, fill=PALETTE["orange_brown"], outline=PALETTE["navy"], width=3)
        self.canvas.create_rectangle(700, 250, 760, 295, fill="#a9a087", outline=PALETTE["navy"], width=3)
        self.canvas.create_line(180, 430, 255, 415, 330, 445, fill=PALETTE["charcoal"], width=4)
        self.canvas.create_line(520, 555, 575, 530, 630, 548, fill=PALETTE["charcoal"], width=4)
        for x, y in [(345, 365), (690, 505), (1010, 345), (445, 608)]:
            self.canvas.create_line(x, y, x + 16, y - 18, fill=PALETTE["grass"], width=3)
            self.canvas.create_line(x + 8, y, x + 26, y - 15, fill=PALETTE["grass"], width=3)

    def draw_playable_field(self, field):
        if field == "Parking Lot":
            self.draw_parking_lot_layout()
        else:
            self.draw_grass_field_layout(field)

    def outfield_curve_points(self, left, center, right, steps=24):
        points = []
        for i in range(steps + 1):
            t = i / steps
            x = (1 - t) ** 2 * left[0] + 2 * (1 - t) * t * center[0] + t ** 2 * right[0]
            y = (1 - t) ** 2 * left[1] + 2 * (1 - t) * t * center[1] + t ** 2 * right[1]
            points.append((x, y))
        return points

    def draw_grass_field_layout(self, field):
        home = (550, 642)
        third = (322, 510)
        second = (550, 375)
        first = (778, 510)
        left = (158, 380)
        center = (550, 225)
        right = (942, 380)
        curve = self.outfield_curve_points(left, center, right)
        grass = "#5f9b4d" if field == "Stadium" else "#67994e"
        light_grass = self.shade(grass, 0.10)
        dark_grass = self.shade(grass, -0.10)
        dirt = "#c58a4b"
        line = PALETTE["cream"]
        fan_points = [home, left] + curve[1:-1] + [right, home]
        self.canvas.create_polygon(fan_points, fill=grass, outline=PALETTE["navy"], width=5, smooth=True)
        if field == "Stadium":
            self.canvas.create_line(curve, fill=PALETTE["navy"], width=10, smooth=True)
            self.canvas.create_line(curve, fill="#516b58", width=6, smooth=True)
            for pole_x, pole_y in [left, right]:
                self.canvas.create_rectangle(pole_x - 5, pole_y - 80, pole_x + 5, pole_y + 20, fill=PALETTE["mustard"], outline=PALETTE["navy"], width=3)
        else:
            self.canvas.create_line(curve, fill=self.shade(PALETTE["brown"], 0.15), width=4, smooth=True, dash=(10, 8))
        self.canvas.create_polygon([home, left, (300, 492), home], fill=dark_grass, outline="")
        self.canvas.create_polygon([home, right, (800, 492), home], fill=light_grass, outline="")
        self.canvas.create_line(home, left, fill=PALETTE["navy"], width=8)
        self.canvas.create_line(home, right, fill=PALETTE["navy"], width=8)
        self.canvas.create_line(home, left, fill=line, width=4)
        self.canvas.create_line(home, right, fill=line, width=4)
        self.canvas.create_polygon(second, first, home, third, fill=dirt, outline=PALETTE["navy"], width=5)
        self.canvas.create_polygon((550, 420), (704, 508), (550, 590), (396, 508), fill=grass, outline="")
        for x, y in [home, third, second, first]:
            self.canvas.create_polygon(x, y - 13, x + 13, y, x, y + 13, x - 13, y, fill=PALETTE["cream"], outline=PALETTE["navy"], width=3)
        self.canvas.create_polygon(513, 648, 587, 648, 573, 674, 527, 674, fill=PALETTE["cream"], outline=PALETTE["navy"], width=3)
        self.canvas.create_line(518, 650, 582, 650, fill=PALETTE["brown"], width=3)

    def draw_parking_lot_layout(self):
        home = (550, 642)
        third = (322, 510)
        second = (550, 375)
        first = (778, 510)
        left = (165, 395)
        center = (550, 250)
        right = (935, 395)
        curve = self.outfield_curve_points(left, center, right)
        chalk = "#eee0bd"
        self.canvas.create_line(home, left, fill=PALETTE["navy"], width=7)
        self.canvas.create_line(home, right, fill=PALETTE["navy"], width=7)
        self.canvas.create_line(home, left, fill=chalk, width=4)
        self.canvas.create_line(home, right, fill=chalk, width=4)
        self.canvas.create_line([home, third, second, first, home], fill=PALETTE["navy"], width=6)
        self.canvas.create_line([home, third, second, first, home], fill=chalk, width=3)
        self.canvas.create_line(curve, fill=chalk, width=3, smooth=True, dash=(12, 9))
        for x, y in [home, third, second, first]:
            self.canvas.create_polygon(x, y - 12, x + 12, y, x, y + 12, x - 12, y, fill=PALETTE["cream"], outline=PALETTE["navy"], width=3)
        self.canvas.create_polygon(512, 648, 588, 648, 574, 674, 526, 674, fill=chalk, outline=PALETTE["navy"], width=3)
        for x, y in [(430, 450), (675, 575), (720, 390), (245, 560), (840, 610)]:
            self.canvas.create_oval(x, y, x + 34, y + 13, fill="#6d665c", outline="")

    def offense_side(self):
        return "away" if self.half == "top" else "home"

    def defense_side(self):
        return "home" if self.half == "top" else "away"

    def team_name(self, side):
        index = self.home_index if side == "home" else self.away_index
        return TEAMS[index][0]

    def team_colors(self, side):
        index = self.home_index if side == "home" else self.away_index
        _, main_name, secondary_name = TEAMS[index]
        return COLOR_MAP[main_name], COLOR_MAP[secondary_name]

    def total_runs(self, side):
        return sum(self.team_stats[side]["runs"])

    def score_run(self):
        side = self.offense_side()
        self.ensure_score_slots()
        self.team_stats[side]["runs"][self.inning - 1] += 1

    def add_hit(self):
        self.team_stats[self.offense_side()]["hits"] += 1

    def add_error(self):
        self.team_stats[self.defense_side()]["errors"] += 1

    def advance_existing_runners(self, bases=1):
        new_bases = [None, None, None]
        for i in range(2, -1, -1):
            runner = self.bases[i]
            if runner is None:
                continue
            target = i + bases
            if target >= 3:
                self.score_run()
            else:
                new_bases[target] = runner
        self.bases = new_bases

    def put_batter_on(self, base_index):
        if base_index >= 3:
            self.score_run()
        else:
            self.bases[base_index] = "runner"

    def advance_with_batter(self, runner_bases, batter_base, hit=False, error=False):
        if hit:
            self.add_hit()
        if error:
            self.add_error()
        self.advance_existing_runners(runner_bases)
        self.put_batter_on(batter_base)

    def walk_batter(self):
        if self.bases[0] is not None:
            if self.bases[1] is not None:
                if self.bases[2] is not None:
                    self.score_run()
                self.bases[2] = self.bases[1]
            self.bases[1] = self.bases[0]
        self.bases[0] = "runner"

    def base_marker_position(self, base_index):
        return [(735, 490), (510, 382), (365, 520)][base_index]

    def batter_marker_position(self):
        return (508 if self.batter_side == 1 else 592, 654)

    def add_out_marker(self, x, y):
        self.out_markers.append((x, y))

    def clear_out_markers(self):
        self.out_markers = []
        self.batter_side = random.choice([-1, 1])
        if self.screen == "game" and not self.rolling:
            self.batter_reaction = "ready"
            self.show_game()

    def schedule_out_marker_clear(self):
        if self.out_markers or self.batter_reaction == "out":
            self.root.after(1000, self.clear_out_markers)

    def clear_simple_result(self, token):
        if token != self.simple_result_token:
            return
        self.simple_result = ""
        if self.screen == "game" and not self.rolling and not self.game_over:
            self.show_game()

    def schedule_simple_result_clear(self):
        if self.simple_result:
            self.simple_result_token += 1
            token = self.simple_result_token
            self.root.after(2000, lambda: self.clear_simple_result(token))

    def lead_forced_base(self):
        if self.bases[0] is None:
            return None
        if self.bases[1] is not None and self.bases[2] is not None:
            return 2
        if self.bases[1] is not None:
            return 1
        return 0

    def double_play(self):
        forced = self.lead_forced_base()
        self.add_out_marker(*self.batter_marker_position())
        if forced is not None:
            self.add_out_marker(*self.base_marker_position(forced))
            self.bases[forced] = None
            self.outs += 2
        else:
            self.outs += 1

    def force_out(self):
        forced = self.lead_forced_base()
        if forced is None:
            self.add_out_marker(*self.batter_marker_position())
            self.outs += 1
            self.advance_existing_runners(1)
            return
        self.add_out_marker(*self.base_marker_position(forced))
        if forced == 2:
            self.bases[2] = self.bases[1]
            self.bases[1] = self.bases[0]
        elif forced == 1:
            self.bases[1] = self.bases[0]
        self.bases[0] = "runner"
        self.outs += 1

    def batter_out_runners_advance(self, bases=0):
        self.add_out_marker(*self.batter_marker_position())
        self.outs += 1
        if bases:
            self.advance_existing_runners(bases)

    def current_rule_result(self):
        dice = tuple(sorted(self.dice_values))
        for combo, result in RULES:
            if combo == dice:
                return result
        return "Unknown"

    def simplified_result(self, dice):
        if dice in [(1, 1), (2, 2)]:
            return "Double"
        if dice == (3, 3):
            return "Triple"
        if dice == (6, 6):
            return "HomeRun"
        if dice in [(1, 4), (2, 4), (5, 5), (1, 3), (4, 4)]:
            return "Single"
        if dice in [(1, 6), (2, 5), (3, 4)]:
            return "Strikeout"
        return "Groundout"

    def resolve_play(self):
        if self.game_over:
            return
        dice = tuple(sorted(self.dice_values))
        result = self.current_rule_result()
        self.last_result = result
        self.simple_result = self.simplified_result(dice)
        self.out_markers = []
        self.batter_reaction = "swing"
        self.team_stats[self.offense_side()]["batters"] += 1
        if dice == (1, 1):
            self.advance_with_batter(2, 1, hit=True)
        elif dice in [(1, 2), (1, 5)]:
            self.double_play()
        elif dice == (1, 3):
            self.walk_batter()
            self.batter_reaction = "walk"
        elif dice == (1, 4):
            self.advance_with_batter(1, 0, hit=True)
        elif dice == (1, 6) or dice == (2, 5) or dice == (3, 4):
            self.batter_out_runners_advance(0)
            self.batter_reaction = "out"
        elif dice == (2, 2):
            self.advance_with_batter(3, 1, hit=True)
        elif dice == (2, 3) or dice == (5, 6):
            self.batter_out_runners_advance(0)
            self.batter_reaction = "out"
        elif dice == (2, 4):
            self.advance_with_batter(2, 0, hit=True)
        elif dice == (2, 6):
            self.force_out()
        elif dice == (3, 3):
            self.advance_with_batter(3, 2, hit=True)
        elif dice == (3, 5):
            self.batter_out_runners_advance(1)
        elif dice == (3, 6) or dice == (4, 5):
            self.batter_out_runners_advance(0)
            self.batter_reaction = "out"
        elif dice == (4, 4):
            self.advance_with_batter(1, 0, error=True)
        elif dice == (4, 6):
            self.batter_out_runners_advance(1)
        elif dice == (5, 5):
            self.advance_with_batter(1, 0, hit=True)
        elif dice == (6, 6):
            self.advance_with_batter(3, 3, hit=True)
        self.check_walkoff_or_switch()
        if self.out_markers:
            self.schedule_out_marker_clear()
        else:
            self.batter_side = random.choice([-1, 1])
        self.schedule_simple_result_clear()

    def check_walkoff_or_switch(self):
        if self.half == "bottom" and self.inning >= self.selected_innings and self.total_runs("home") > self.total_runs("away"):
            self.finish_game("home")
            return
        if self.outs < 3:
            return
        self.bases = [None, None, None]
        self.outs = 0
        self.batter_reaction = "ready"
        if self.half == "top":
            if self.inning >= self.selected_innings and self.total_runs("home") > self.total_runs("away"):
                self.finish_game("home")
            else:
                self.half = "bottom"
        else:
            if self.inning >= self.selected_innings and self.total_runs("home") != self.total_runs("away"):
                self.finish_game("home" if self.total_runs("home") > self.total_runs("away") else "away")
            else:
                self.inning += 1
                self.half = "top"
                self.ensure_score_slots()

    def finish_game(self, winning_side):
        self.game_over = True
        self.game_active = False
        self.rolling = False
        self.winner = self.team_name(winning_side)
        self.last_result = "Final"

    def draw_players(self):
        if not hasattr(self, "bases"):
            return
        defense_main, defense_secondary = self.team_colors(self.defense_side())
        offense_main, offense_secondary = self.team_colors(self.offense_side())
        positions = [
            ("P", 550, 468, "pitcher", "#8b5a3c", "#2b1b16"),
            ("C", 550, 684, "catcher", "#5f3826", "#1b1715"),
            ("1B", 822, 484, "first", "#c9875b", "#4a2c1c"),
            ("2B", 630, 402, "infielder", "#f0b47a", "#5b321d"),
            ("3B", 286, 492, "infielder", "#7a4a31", "#1d1512"),
            ("SS", 456, 414, "infielder", "#b9774f", "#332018"),
            ("LF", 250, 350, "outfielder", "#6f432e", "#1b1715"),
            ("CF", 550, 292, "outfielder", "#d89a68", "#6b3a1e"),
            ("RF", 850, 350, "outfielder", "#9f6646", "#271b17"),
        ]
        for label, x, y, role, skin, hair in positions:
            self.draw_player(x, y, defense_main, defense_secondary, role, skin, hair, label)
        batter_x = 508 if self.batter_side == 1 else 592
        self.draw_batter(batter_x, 654, offense_main, offense_secondary)
        runner_positions = [(735, 490, "second"), (510, 382, "third"), (365, 520, "home")]
        for occupied, (x, y, direction) in zip(self.bases, runner_positions):
            if occupied is not None:
                self.draw_runner(x, y, offense_main, offense_secondary, direction)
        for x, y in self.out_markers:
            self.canvas.create_text(x, y - 58, text="X", fill=PALETTE["dusty_red"], font=("Courier", 24, "bold"))

    def draw_player_cap(self, x, y, main, secondary, facing=1):
        outline = PALETTE["navy"]
        crown = [(x - 18, y), (x - 12, y - 12), (x + 8, y - 16), (x + 20, y - 8), (x + 18, y + 3), (x - 12, y + 5)]
        brim = [(x + 8 * facing, y + 1), (x + 30 * facing, y + 3), (x + 22 * facing, y + 11), (x + 4 * facing, y + 8)]
        if facing < 0:
            crown = [(x - (px - x), py) for px, py in crown]
        self.canvas.create_polygon(crown, fill=main, outline=outline, width=3, smooth=True)
        self.canvas.create_polygon(brim, fill=secondary, outline=outline, width=3, smooth=True)
        self.canvas.create_polygon([(x - 11, y - 2), (x - 5, y - 10), (x + 5, y - 12), (x, y + 2)], fill=self.shade(main, 0.18), outline="")

    def draw_jersey(self, x, y, main, secondary, width=38, height=40, lean=0):
        outline = PALETTE["navy"]
        left = x - width // 2 + lean
        right = x + width // 2 + lean
        top = y
        bottom = y + height
        self.canvas.create_polygon(left, top + 6, x - 8 + lean, top, x + 8 + lean, top, right, top + 6, right - 4, bottom, left + 4, bottom, fill=main, outline=outline, width=4)
        self.canvas.create_polygon(left - 12, top + 8, left + 4, top + 5, left + 8, top + 20, left - 8, top + 24, fill=secondary, outline=outline, width=3)
        self.canvas.create_polygon(right + 12, top + 8, right - 4, top + 5, right - 8, top + 20, right + 8, top + 24, fill=secondary, outline=outline, width=3)
        self.canvas.create_polygon(x - 11 + lean, top + 1, x, top + 12, x + 11 + lean, top + 1, x + 6 + lean, top, x, top + 6, x - 6 + lean, top, fill=PALETTE["cream"], outline=outline, width=2)
        self.canvas.create_line(x + lean, top + 12, x + lean, bottom - 4, fill=PALETTE["cream"], width=3)
        for by in [top + 19, top + 29]:
            self.canvas.create_rectangle(x - 2 + lean, by, x + 2 + lean, by + 3, fill=secondary, outline="")
        self.canvas.create_polygon(left + 4, bottom, x - 3 + lean, bottom, x - 8 + lean, bottom + 17, left + 6, bottom + 17, fill=PALETTE["cream"], outline=outline, width=3)
        self.canvas.create_polygon(x + 3 + lean, bottom, right - 4, bottom, right - 6, bottom + 17, x + 8 + lean, bottom + 17, fill=PALETTE["cream"], outline=outline, width=3)

    def draw_player(self, x, y, main, secondary, role, skin, hair, label):
        outline = PALETTE["navy"]
        if role == "pitcher":
            self.canvas.create_oval(x - 28, y - 8, x + 28, y + 14, fill="#b97f4b", outline=outline, width=3)
            self.canvas.create_line(x + 8, y - 10, x + 30, y - 35, fill=outline, width=5)
            self.canvas.create_oval(x + 26, y - 42, x + 38, y - 30, fill=PALETTE["cream"], outline=outline, width=2)
        elif role == "catcher":
            self.canvas.create_rectangle(x - 20, y - 18, x + 20, y + 18, fill=secondary, outline=outline, width=4)
            self.canvas.create_line(x - 18, y + 10, x - 36, y + 30, fill=outline, width=5)
            self.canvas.create_line(x + 18, y + 10, x + 36, y + 30, fill=outline, width=5)
            self.canvas.create_oval(x - 30, y - 48, x + 30, y + 2, fill=main, outline=outline, width=4)
            self.canvas.create_line(x - 18, y - 28, x + 18, y - 28, fill=PALETTE["cream"], width=3)
            self.canvas.create_line(x - 16, y - 16, x + 16, y - 16, fill=PALETTE["cream"], width=3)
            return
        elif role == "first":
            self.canvas.create_oval(x - 48, y - 5, x - 24, y + 22, fill=PALETTE["brown"], outline=outline, width=3)
        elif role == "infielder":
            self.canvas.create_oval(x + 24, y + 2, x + 48, y + 25, fill=PALETTE["brown"], outline=outline, width=3)
        else:
            self.canvas.create_oval(x + 20, y - 3, x + 44, y + 20, fill=PALETTE["brown"], outline=outline, width=3)
        self.draw_jersey(x, y - 14, main, secondary, 40, 38)
        self.canvas.create_oval(x - 16, y - 45, x + 16, y - 13, fill=skin, outline=outline, width=3)
        self.canvas.create_rectangle(x - 14, y - 48, x + 14, y - 36, fill=hair, outline=outline, width=2)
        self.draw_player_cap(x, y - 50, main, secondary, 1 if x < 550 else -1)

    def draw_batter(self, x, y, main, secondary):
        outline = PALETTE["navy"]
        d = getattr(self, "batter_side", 1)
        self.canvas.create_line(x + 24 * d, y - 62, x + 68 * d, y - 104, fill=outline, width=8)
        self.canvas.create_line(x + 24 * d, y - 62, x + 68 * d, y - 104, fill=PALETTE["brown"], width=5)
        self.draw_jersey(x + 2 * d, y - 20, main, secondary, 42, 42, lean=3 * d)
        self.canvas.create_line(x - 16 * d, y - 6, x + 27 * d, y - 57, fill=outline, width=6)
        self.canvas.create_line(x + 3 * d, y - 8, x + 29 * d, y - 58, fill=outline, width=6)
        self.canvas.create_oval(x + 22 * d - 7, y - 64, x + 22 * d + 7, y - 50, fill=PALETTE["cream"], outline=outline, width=2)
        self.canvas.create_oval(x - 17, y - 56, x + 17, y - 23, fill="#b9774f", outline=outline, width=3)
        if d == 1:
            self.canvas.create_rectangle(x - 18, y - 39, x + 6, y - 31, fill="#3b2419", outline="")
        else:
            self.canvas.create_rectangle(x - 6, y - 39, x + 18, y - 31, fill="#3b2419", outline="")
        self.draw_player_cap(x, y - 61, main, secondary, d)
        if self.batter_reaction == "walk":
            self.canvas.create_text(x - 5, y - 88, text="!", fill=PALETTE["mustard"], font=("Courier", 18, "bold"))
        elif self.batter_reaction == "out":
            self.canvas.create_text(x - 10, y - 88, text="X", fill=PALETTE["dusty_red"], font=("Courier", 16, "bold"))

    def draw_runner(self, x, y, main, secondary, direction):
        outline = PALETTE["navy"]
        lean = {"second": -16, "third": -18, "home": 16}[direction]
        self.draw_jersey(x + lean // 4, y - 18, main, secondary, 36, 38, lean=lean // 5)
        self.canvas.create_oval(x - 14, y - 46, x + 16, y - 16, fill="#d89a68", outline=outline, width=3)
        self.draw_player_cap(x, y - 51, main, secondary, -1 if lean < 0 else 1)
        self.canvas.create_line(x + 12, y - 4, x + lean + 28, y - 12, fill=outline, width=5)

    def draw_victory_overlay(self):
        self.canvas.create_rectangle(0, 0, WIDTH, HEIGHT, fill="#202f4f", stipple="gray50", outline="")
        self.panel(255, 190, 845, 500, PALETTE["card"], PALETTE["navy"], 8)
        for x, y, color in [(310, 245, PALETTE["mustard"]), (780, 250, PALETTE["dusty_red"]), (390, 440, PALETTE["sky"]), (715, 430, PALETTE["grass"]), (548, 230, PALETTE["orange_brown"] )]:
            self.canvas.create_text(x, y, text="*", fill=color, font=("Courier", 32, "bold"))
        self.title_text(550, 300, "{} Wins!".format(self.winner), 34)
        self.canvas.create_text(550, 358, text="Final: {} {} - {} {}".format(self.team_name("away"), self.total_runs("away"), self.team_name("home"), self.total_runs("home")), fill=PALETTE["navy"], font=("Courier", 16, "bold"))
        self.button(410, 405, 690, 470, "Return Home", self.return_to_setup_after_game, PALETTE["dusty_red"])

    def draw_scoreboard(self):
        self.ensure_score_slots()
        home = self.team_name("home")
        away = self.team_name("away")
        self.panel(145, 52, 985, 194, PALETTE["card"], PALETTE["navy"], 6)
        half_text = "TOP" if self.half == "top" else "BOT"
        self.canvas.create_text(560, 76, text="SCOREBOARD", fill=PALETTE["dusty_red"], font=("Courier", 18, "bold"))
        self.canvas.create_text(800, 76, text="{} {}".format(half_text, self.inning), fill=PALETTE["navy"], font=("Courier", 13, "bold"))
        self.canvas.create_text(872, 76, text="OUTS", fill=PALETTE["navy"], font=("Courier", 11, "bold"))
        for i in range(3):
            fill = PALETTE["dusty_red"] if i < self.outs else PALETTE["cream"]
            self.canvas.create_oval(910 + i * 20, 67, 924 + i * 20, 81, fill=fill, outline=PALETTE["navy"], width=2)
        visible = 7
        start_inning = max(1, self.inning - visible + 1)
        end_inning = start_inning + visible - 1
        innings = list(range(start_inning, end_inning + 1))
        team_x = 188
        divider_x = 430
        inning_start = 470
        inning_gap = 38
        inning_xs = [inning_start + i * inning_gap for i in range(visible)]
        total_xs = {"R": 768, "H": 832, "E": 896}
        self.canvas.create_line(divider_x, 102, divider_x, 184, fill=PALETTE["brown"], width=3)
        self.canvas.create_line(748, 102, 748, 184, fill=PALETTE["brown"], width=3)
        self.canvas.create_line(166, 130, 965, 130, fill=PALETTE["brown"], width=2)
        self.canvas.create_line(166, 160, 965, 160, fill="#e3c78f", width=2)
        self.canvas.create_text(team_x, 116, text="TEAM", anchor="w", fill=PALETTE["navy"], font=("Courier", 11, "bold"))
        for inning_num, x in zip(innings, inning_xs):
            self.canvas.create_text(x, 116, text=str(inning_num), fill=PALETTE["navy"], font=("Courier", 11, "bold"))
        for label, x in total_xs.items():
            self.canvas.create_text(x, 116, text=label, fill=PALETTE["navy"], font=("Courier", 11, "bold"))
        for row_y, side, team in [(148, "away", away), (178, "home", home)]:
            name_font = 10 if len(team) > 12 else 11
            self.canvas.create_text(team_x, row_y, text=team, anchor="w", fill=PALETTE["charcoal"], font=("Courier", name_font, "bold"))
            for inning_num, x in zip(innings, inning_xs):
                runs = self.team_stats[side]["runs"][inning_num - 1] if inning_num <= len(self.team_stats[side]["runs"]) else ""
                self.canvas.create_text(x, row_y, text=str(runs), fill=PALETTE["charcoal"], font=("Courier", 11, "bold"))
            self.canvas.create_text(total_xs["R"], row_y, text=str(self.total_runs(side)), fill=PALETTE["charcoal"], font=("Courier", 11, "bold"))
            self.canvas.create_text(total_xs["H"], row_y, text=str(self.team_stats[side]["hits"]), fill=PALETTE["charcoal"], font=("Courier", 11, "bold"))
            self.canvas.create_text(total_xs["E"], row_y, text=str(self.team_stats[side]["errors"]), fill=PALETTE["charcoal"], font=("Courier", 11, "bold"))

    def draw_dice_area(self):
        if self.simple_result:
            self.panel(895, 458, 1070, 497, PALETTE["mustard"], PALETTE["navy"], 4)
            self.canvas.create_text(982, 478, text=self.simple_result, fill=PALETTE["navy"], font=("Courier", 13, "bold"))
        self.panel(895, 500, 1070, 705, PALETTE["card"], PALETTE["navy"], 5)
        self.canvas.create_text(982, 526, text="DICE", fill=PALETTE["dusty_red"], font=("Courier", 18, "bold"))
        self.draw_die(922, 552, 58, self.dice_values[0])
        self.draw_die(995, 552, 58, self.dice_values[1])
        if self.game_over:
            text = "Final"
            action = self.noop_roll
        else:
            text = "Rolling..." if self.rolling else "Roll Dice"
            action = self.noop_roll if self.rolling else self.roll_dice
        self.button(913, 640, 1057, 690, text, action, PALETTE["dusty_red"])

    def refresh_dice_faces(self):
        self.canvas.create_rectangle(916, 546, 1060, 616, fill=PALETTE["card"], outline="")
        self.draw_die(922, 552, 58, self.dice_values[0])
        self.draw_die(995, 552, 58, self.dice_values[1])

    def noop_roll(self):
        return

    def roll_dice(self):
        if self.rolling or self.game_over:
            return
        self.rolling = True
        self.show_game()
        self.animate_roll(8)

    def animate_roll(self, frames):
        if self.screen != "game":
            self.rolling = False
            return
        self.dice_values = (random.randint(1, 6), random.randint(1, 6))
        self.refresh_dice_faces()
        if frames <= 1:
            self.rolling = False
            self.resolve_play()
            self.show_game()
            return
        self.root.after(15, lambda: self.animate_roll(frames - 1))

    def set_innings(self, innings):
        self.selected_innings = innings
        self.show_setup()

    def set_field(self, field):
        self.selected_field = field
        self.show_setup()

    def change_home(self, amount):
        self.home_index = (self.home_index + amount) % len(TEAMS)
        self.show_setup()

    def change_away(self, amount):
        self.away_index = (self.away_index + amount) % len(TEAMS)
        self.show_setup()

    def team_selector(self, x, y, role, index, change_callback, direction):
        name, main_name, secondary_name = TEAMS[index]
        main = COLOR_MAP[main_name]
        secondary = COLOR_MAP[secondary_name]
        self.panel(x, y, x + 270, y + 485, PALETTE["card"], PALETTE["brown"], 6)
        self.canvas.create_text(x + 135, y + 38, text=role + " Team", fill=PALETTE["dusty_red"], font=("Courier", 22, "bold"))
        self.button(x + 18, y + 86, x + 72, y + 136, "<", lambda: change_callback(-1), PALETTE["orange_brown"])
        self.button(x + 198, y + 86, x + 252, y + 136, ">", lambda: change_callback(1), PALETTE["orange_brown"])
        self.canvas.create_text(x + 135, y + 111, text=name, fill=PALETTE["navy"], font=("Courier", 17, "bold"), width=120)
        letters = CAP_LETTERS.get(name, name[0])
        self.draw_hat(x + 135, y + 258, main, secondary, letters, 1.0, direction)

    def shade(self, color, amount):
        color = color.lstrip("#")
        rgb = [int(color[i:i + 2], 16) for i in (0, 2, 4)]
        adjusted = []
        for value in rgb:
            if amount >= 0:
                adjusted.append(int(value + (255 - value) * amount))
            else:
                adjusted.append(int(value * (1 + amount)))
        return "#{:02x}{:02x}{:02x}".format(*adjusted)

    def p(self, cx, cy, scale, direction, points):
        flip = -1 if direction == "left" else 1
        return [(cx + x * scale * flip, cy + y * scale) for x, y in points]

    def draw_hat(self, cx, cy, main, secondary, letters, scale, direction="right"):
        s = scale
        outline = PALETTE["navy"]
        thick = max(4, int(6 * s))
        thin = max(2, int(2 * s))
        highlight = self.shade(secondary, 0.24)
        shadow = self.shade(secondary, -0.28)
        brim_shadow = self.shade(main, -0.22)
        crown = [(-75, 8), (-68, -30), (-42, -56), (4, -66), (44, -54), (68, -25), (75, 8), (61, 34), (16, 45), (-38, 39), (-69, 23)]
        front_panel = [(12, -56), (47, -48), (68, -21), (68, 12), (55, 32), (18, 41), (4, -10)]
        crown_highlight = [(-56, -4), (-43, -32), (-18, -51), (5, -58), (2, -17), (-16, 25), (-48, 22)]
        lower_shadow = [(-66, 15), (-35, 32), (7, 38), (53, 30), (43, 42), (8, 50), (-39, 44), (-72, 25)]
        brim = [(-22, 23), (18, 17), (64, 18), (104, 27), (122, 38), (112, 50), (67, 56), (16, 50), (-28, 37)]
        self.canvas.create_polygon(self.p(cx, cy, s, direction, crown), fill=secondary, outline=outline, width=thick, joinstyle=tk.ROUND)
        self.canvas.create_polygon(self.p(cx, cy, s, direction, crown_highlight), fill=highlight, outline="")
        self.canvas.create_polygon(self.p(cx, cy, s, direction, lower_shadow), fill=shadow, outline="")
        self.canvas.create_polygon(self.p(cx, cy, s, direction, front_panel), fill=self.shade(secondary, 0.08), outline=outline, width=thin, joinstyle=tk.ROUND)
        self.canvas.create_polygon(self.p(cx, cy, s, direction, brim), fill=main, outline=outline, width=thick, joinstyle=tk.ROUND)
        self.canvas.create_polygon(self.p(cx, cy, s, direction, [(12, 43), (64, 48), (112, 46), (122, 38), (112, 50), (67, 56), (16, 50)]), fill=brim_shadow, outline="")
        self.canvas.create_line(*sum(self.p(cx, cy, s, direction, [(-9, -60), (-1, -16), (-5, 34)]), ()), fill=outline, width=thin)
        self.canvas.create_oval(cx - 7 * s, cy - 73 * s, cx + 7 * s, cy - 59 * s, fill=main, outline=outline, width=thin)
        letter_x = cx + (38 if direction == "right" else -38) * s
        self.canvas.create_text(letter_x + 3 * s, cy - 2 * s, text=letters, fill=outline, font=("Courier", int(45 * s), "bold"))
        self.canvas.create_text(letter_x, cy - 5 * s, text=letters, fill=PALETTE["cream"], font=("Courier", int(45 * s), "bold"))

    def draw_die(self, x, y, size, value):
        self.canvas.create_rectangle(x + 2, y + 2, x + size + 2, y + size + 2, fill="#c5a372", outline="")
        self.canvas.create_rectangle(x, y, x + size, y + size, fill=PALETTE["cream"], outline=PALETTE["navy"], width=2)
        dot_positions = {
            1: [(0.5, 0.5)],
            2: [(0.28, 0.28), (0.72, 0.72)],
            3: [(0.28, 0.28), (0.5, 0.5), (0.72, 0.72)],
            4: [(0.28, 0.28), (0.72, 0.28), (0.28, 0.72), (0.72, 0.72)],
            5: [(0.28, 0.28), (0.72, 0.28), (0.5, 0.5), (0.28, 0.72), (0.72, 0.72)],
            6: [(0.28, 0.25), (0.72, 0.25), (0.28, 0.5), (0.72, 0.5), (0.28, 0.75), (0.72, 0.75)],
        }
        r = max(2, size // 10)
        for px, py in dot_positions[value]:
            cx = x + size * px
            cy = y + size * py
            self.canvas.create_rectangle(cx - r, cy - r, cx + r, cy + r, fill=PALETTE["charcoal"], outline="")

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    DiceBaseballApp().run()

