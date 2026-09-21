#!/usr/bin/env python3
"""Constructeur d'animations EVA — grille 16x16, GIF 1600x1600.

Tu peux definir chaque frame toi-meme avec :
- les deux yeux (pattern, position, couleur),
- un sourire (pattern, position, couleur),
- autant d'artefacts/symboles que tu veux (pattern, position, couleur),
- une duree precise en millisecondes.

Le nom final contient automatiquement la duree totale :
EVA_CUSTOM_2500ms.gif signifie que le GIF dure 2500 millisecondes, soit 2,5 s.

Installation :
    py -m pip install pillow

Execution :
    py eva_animation_builder.py
"""

from pathlib import Path
from PIL import Image

# -----------------------------------------------------------------------------
# FORMAT EVA : 16x16 pixels logiques, chaque pixel devient 100x100 px.
# -----------------------------------------------------------------------------
LOGICAL_W = 16
LOGICAL_H = 16
SCALE = 100
FINAL_SIZE = (LOGICAL_W * SCALE, LOGICAL_H * SCALE)
OUT = Path("eva_output_16x16")
TRANSPARENT = (0, 0, 0, 0)

# Couleurs disponibles. Tu peux en ajouter librement.
COLORS = {
    "cyan": (0, 255, 255, 255),     # #00FFFF
    "ciel": (165, 255, 255, 255),   # #A5FFFF
    "green": (0, 255, 0, 255),      # #00FF00
    "pink": (253, 152, 159, 255),   # #FD989F
    "pinki": (255, 0, 255, 255),    # #FF00FF
    "red": (255, 35, 35, 255),
    "white": (255, 255, 255, 255),   # #FFFFFF
}

# Palette GIF fixe : index 0 est le fond transparent.
# Ne supprime pas l'index 0. Si tu ajoutes une couleur dans COLORS, ajoute-la
# aussi ici et dans COLOR_INDEX, avec le meme ordre.
PALETTE_ORDER = [
    "cyan", "ciel", "pink", "pinki","red", "green", "white"
]

TRAIL_COLORS = ["cyan", "ciel","pink", "pinki", "red", "green", "white"]
COLOR_INDEX = {name: index + 1 for index, name in enumerate(PALETTE_ORDER)}
GIF_PALETTE = [0, 0, 0]
for name in PALETTE_ORDER:
    r, g, b, _ = COLORS[name]
    GIF_PALETTE.extend([r, g, b])
GIF_PALETTE.extend([0, 0, 0] * (256 - 1 - len(PALETTE_ORDER)))

# -----------------------------------------------------------------------------
# PATTERNS : # = pixel allume; . = transparent.
# Tu peux creer tes propres formes sous un nouveau nom.
# -----------------------------------------------------------------------------
PATTERNS = {
    # Yeux
    "open": [
        ".##.",
        "#..#",
        "#..#",
        ".##.",
    ],
    "half": [
        "....",
        ".##.",
        "#..#",
        ".##.",
    ],
    "close": [
        "....",
        "....",
        "####",
        "....",
    ],
    "bar": [
        "######",
    ],

    # Sourires / bouches / joux

    "joux": [
        "##",
    ],

    "crosse_+": [
        ".#.",
        "###",
        ".#.",
    ],

      "crosse_x": [
            "#.#",
            ".#.",
            "#.#",
        ],
    

    # Artefacts et symboles
    "angry_open": [
        ".#.#.",
        "##.##",
        ".....",
        "##.##",
        ".#.#.",
    ],

    "angry_close": [
        ".....",
        "..#..",
        ".###.",
        "..#..",
        ".....",
    ],

    "hearts": [
        ".....",
        ".#.#.",
        ".###.",
        "..#..",
    ],

    "heart": [
        ".#.#.",
        "#####",
        ".###.",
        "..#..",
    ],

    "heartx": [
        ".#.#.",
        "#####",
        "#####",
        ".###.",
        ".###.",
        "..#..",
    ],

    "dot": [
        "#",
    ],
    "exclamation": [
        "#",
        "#",
        ".",
        "#",
    ],
    "question": [
        ".##.",
        "#..#",
        "..#.",
        "....",
        "..#.",
    ],
}


def color_rgba(name):
    if name not in COLORS:
        choices = ", ".join(COLORS)
        raise ValueError(f"Couleur inconnue : {name}. Couleurs possibles : {choices}")
    return COLORS[name]


def new_logical_frame():
    return Image.new("RGBA", (LOGICAL_W, LOGICAL_H), TRANSPARENT)


def draw_pattern(image, pattern_name, center_x, center_y, color="blue"):
    """Dessine un pattern centre sur (center_x, center_y) dans la grille 16x16."""
    if pattern_name not in PATTERNS:
        choices = ", ".join(PATTERNS)
        raise ValueError(f"Pattern inconnu : {pattern_name}. Patterns possibles : {choices}")

    pattern = PATTERNS[pattern_name]
    width = max(len(line) for line in pattern)
    height = len(pattern)
    start_x = round(center_x - width / 2)
    start_y = round(center_y - height / 2)
    pixels = image.load()
    rgba = color_rgba(color)

    for row, line in enumerate(pattern):
        for col, value in enumerate(line):
            x = start_x + col
            y = start_y + row
            if value == "#" and 0 <= x < LOGICAL_W and 0 <= y < LOGICAL_H:
                pixels[x, y] = rgba


def draw_item(image, item):
    """Dessine un objet {pattern, x, y, color}; couleur bleu par defaut."""
    draw_pattern(
        image,
        pattern_name=item["pattern"],
        center_x=item["x"],
        center_y=item["y"],
        color=item.get("color", "blue"),
    )


def make_frame(eyes=None, mouth=None, artifacts=None):
    """Construit une frame.

    eyes : dictionnaire avec left et right, ou None
    mouth : dictionnaire {pattern, x, y, color}, ou None
    artifacts : liste de dictionnaires {pattern, x, y, color}
    """
    image = new_logical_frame()

    if eyes is not None:
        draw_pattern(image, eyes["left"]["pattern"], eyes["left"]["x"], eyes["left"]["y"], eyes["left"].get("color", "blue"))
        draw_pattern(image, eyes["right"]["pattern"], eyes["right"]["x"], eyes["right"]["y"], eyes["right"].get("color", "blue"))

    if mouth is not None:
        draw_item(image, mouth)

    for artifact in artifacts or []:
        draw_item(image, artifact)

    return image


def enlarge(logical_image):
    return logical_image.resize(FINAL_SIZE, Image.Resampling.NEAREST)


def to_gif_palette(image):
    """Convertit une image RGBA en GIF palette avec fond transparent."""
    rgba = image.convert("RGBA")
    indexed = Image.new("P", rgba.size, 0)
    indexed.putpalette(GIF_PALETTE)
    source = rgba.load()
    target = indexed.load()

    rgb_to_index = {
        COLORS[name][:3]: COLOR_INDEX[name]
        for name in PALETTE_ORDER
    }

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = source[x, y]
            if a == 0:
                target[x, y] = 0
            else:
                target[x, y] = rgb_to_index.get((r, g, b), COLOR_INDEX["cyan"])

    return indexed

def draw_frame_with_trail(frame_specs, current_index):
    """
    Dessine la frame actuelle et les anciennes frames demandées avec une traînée.

    "back_frames": 3 signifie :
    - frame actuelle : couleur originale indiquée dans la frame;
    - frame précédente : 1re couleur de traînée;
    - 2 frames avant : 2e couleur de traînée;
    - 3 frames avant : 3e couleur de traînée.

    La traînée applique une nouvelle couleur seulement aux yeux.
    La bouche et les artefacts restent ceux de la frame actuelle.
    """
    current_spec = frame_specs[current_index]
    image = new_logical_frame()

    back_frames = int(current_spec.get("back_frames", 0))

    # Dessine les anciennes positions, de la plus éloignée à la plus récente.
    # Ainsi, la position récente passe par-dessus la position ancienne.
    for offset in range(back_frames, 0, -1):
        old_index = current_index - offset

        # Au début de l'animation, il n'existe pas encore de frame précédente.
        if old_index < 0:
            continue

        old_spec = frame_specs[old_index]
        old_eyes = old_spec.get("eyes")

        # Si cette ancienne frame n'a pas d'yeux, il n'y a rien à dessiner.
        if old_eyes is None:
            continue

        # La frame juste avant reçoit TRAIL_COLORS[1] = blue.
        # Celle d'avant reçoit TRAIL_COLORS[2] = green, etc.
        trail_color = TRAIL_COLORS[min(offset, len(TRAIL_COLORS) - 1)]

        draw_pattern(
            image,
            old_eyes["left"]["pattern"],
            old_eyes["left"]["x"],
            old_eyes["left"]["y"],
            trail_color,
        )

        draw_pattern(
            image,
            old_eyes["right"]["pattern"],
            old_eyes["right"]["x"],
            old_eyes["right"]["y"],
            trail_color,
        )

    # Dessine les yeux de la frame actuelle par-dessus la traînée.
    current_eyes = current_spec.get("eyes")
    if current_eyes is not None:
        draw_pattern(
            image,
            current_eyes["left"]["pattern"],
            current_eyes["left"]["x"],
            current_eyes["left"]["y"],
            current_eyes["left"].get("color", "cyan"),
        )

        draw_pattern(
            image,
            current_eyes["right"]["pattern"],
            current_eyes["right"]["x"],
            current_eyes["right"]["y"],
            current_eyes["right"].get("color", "cyan"),
        )

    # La bouche et les artefacts viennent uniquement de la frame actuelle.
    current_mouth = current_spec.get("mouth")
    if current_mouth is not None:
        draw_item(image, current_mouth)

    for artifact in current_spec.get("artifacts", []):
        draw_item(image, artifact)

    return image

def compile_animation(name, frame_specs):
    """Cree un GIF a partir de frames avec durees en millisecondes.

    Exemple d'une frame :
    {
        "duration": 400,
        "eyes": {
            "left": {"pattern": "open", "x": 5, "y": 5, "color": "blue"},
            "right": {"pattern": "open", "x": 12, "y": 5, "color": "blue"},
        },
        "mouth": {"pattern": "smile", "x": 8, "y": 11, "color": "blue"},
        "artifacts": [{"pattern": "spark", "x": 2, "y": 3, "color": "pink"}],
    }
    """
    if not frame_specs:
        raise ValueError("Il faut au moins une frame.")

    gif_frames = []
    durations = []

    for spec in frame_specs:
        duration = int(spec.get("duration", 125))
        if duration <= 0:
            raise ValueError("Chaque duration doit etre plus grande que 0 ms.")

        logical = draw_frame_with_trail(frame_specs, len(gif_frames))

        gif_frames.append(to_gif_palette(enlarge(logical)))
        durations.append(duration)

    total_ms = sum(durations)
    output_file = OUT / f"{name}_{total_ms}.gif"

    gif_frames[0].save(
        output_file,
        format="GIF",
        save_all=True,
        append_images=gif_frames[1:],
        duration=durations,
        loop=0,
        disposal=2,
        transparency=0,
        optimize=False,
    )
    print(f"OK : {output_file} | {len(gif_frames)} frames | duree totale : {total_ms} ms")


# -----------------------------------------------------------------------------
# ICI, TU CREES TES ANIMATIONS.
# Une frame contient son temps en ms : 1000 ms = 1 seconde.
# -----------------------------------------------------------------------------
def build_animations():
    deux_larmes_grand_decalage = [

        # Larme droite seule : avance initiale de 500 ms
{
    "duration": 500,
    "back_frames": 0,
    "eyes": {
        "left": {"pattern": "half", "x": 5, "y": 5.5, "color": "cyan"},
        "right": {"pattern": "half", "x": 12, "y": 5.5, "color": "cyan"},
    },
    "artifacts": [
        {"pattern": "dot", "x": 11.5, "y": 6.5, "color": "white"},
    ],
},

# La larme gauche apparaît; la droite est légèrement en avance
{
    "duration": 250,
    "back_frames": 0,
    "eyes": {
        "left": {"pattern": "half", "x": 5, "y": 5.5, "color": "cyan"},
        "right": {"pattern": "half", "x": 12, "y": 5.5, "color": "cyan"},
    },
    "artifacts": [
        {"pattern": "dot", "x": 5.5, "y": 6.5, "color": "white"},
        {"pattern": "dot", "x": 12.5, "y": 6.5, "color": "white"},
    ],
},

# Les deux vont vers l'extérieur, droite toujours une étape devant
{
    "duration": 250,
    "back_frames": 0,
    "eyes": {
        "left": {"pattern": "half", "x": 5, "y": 5.5, "color": "cyan"},
        "right": {"pattern": "half", "x": 12, "y": 5.5, "color": "cyan"},
    },
    "artifacts": [
        {"pattern": "dot", "x": 5, "y": 6.5, "color": "white"},
        {"pattern": "dot", "x": 13, "y": 6.5, "color": "white"},
    ],
},

# La droite arrive au coin extérieur avant la gauche
{
    "duration": 250,
    "back_frames": 0,
    "eyes": {
        "left": {"pattern": "half", "x": 5, "y": 5.5, "color": "cyan"},
        "right": {"pattern": "half", "x": 12, "y": 5.5, "color": "cyan"},
    },
    "artifacts": [
        {"pattern": "dot", "x": 4.5, "y": 6.5, "color": "white"},
        {"pattern": "dot", "x": 13.5, "y": 6.5, "color": "white"},
    ],
},

# La gauche arrive au coin; la droite commence à tomber
{
    "duration": 250,
    "back_frames": 0,
    "eyes": {
        "left": {"pattern": "half", "x": 5, "y": 5.5, "color": "cyan"},
        "right": {"pattern": "half", "x": 12, "y": 5.5, "color": "cyan"},
    },
    "artifacts": [
        {"pattern": "dot", "x": 3.5, "y": 6.5, "color": "white"},
        {"pattern": "dot", "x": 13.5, "y": 7.5, "color": "white"},
    ],
},

# Descente avec un décalage d'une position
{
    "duration": 250,
    "back_frames": 0,
    "eyes": {
        "left": {"pattern": "half", "x": 5, "y": 5.5, "color": "cyan"},
        "right": {"pattern": "half", "x": 12, "y": 5.5, "color": "cyan"},
    },
    "artifacts": [
        {"pattern": "dot", "x": 3.5, "y": 7.5, "color": "white"},
        {"pattern": "dot", "x": 13.5, "y": 8.5, "color": "white"},
    ],
},

# La droite arrive au bas, la gauche est juste derrière
{
    "duration": 450,
    "back_frames": 0,
    "eyes": {
        "left": {"pattern": "half", "x": 5, "y": 5.5, "color": "cyan"},
        "right": {"pattern": "half", "x": 12, "y": 5.5, "color": "cyan"},
    },
    "artifacts": [
        {"pattern": "dot", "x": 3.5, "y": 8.5, "color": "white"},
        {"pattern": "dot", "x": 13.5, "y": 9.5, "color": "white"},
    ],
},

# Les deux atteignent le bas ensemble
{
    "duration": 500,
    "back_frames": 0,
    "eyes": {
        "left": {"pattern": "half", "x": 5, "y": 5.5, "color": "cyan"},
        "right": {"pattern": "half", "x": 12, "y": 5.5, "color": "cyan"},
    },
    "artifacts": [
        {"pattern": "dot", "x": 3.5, "y": 9.5, "color": "white"},
        {"pattern": "dot", "x": 13.5, "y": 9.5, "color": "white"},
    ],
},
    ]

    compile_animation("DEUX_LARMES_GRAND_DECALAGE", deux_larmes_grand_decalage)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    build_animations()
    print("Termine : uniquement les GIF finaux ont ete enregistres.")
