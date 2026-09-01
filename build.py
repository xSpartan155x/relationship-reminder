"""
Crea l'eseguibile  dist/FidanzamentoReminder.exe  con PyInstaller.

Uso:
    python build.py

Genera anche icon.ico dal cuore dell'app. Installa PyInstaller se manca.
"""

import os
import sys
import subprocess

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ICON = os.path.join(HERE, "icon.ico")
APP = "FidanzamentoReminder"


def make_ico():
    s = 256
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = (232, 74, 127, 255)
    d.ellipse((s * 0.10, s * 0.16, s * 0.54, s * 0.60), fill=c)
    d.ellipse((s * 0.46, s * 0.16, s * 0.90, s * 0.60), fill=c)
    d.polygon([(s * 0.13, s * 0.45), (s * 0.87, s * 0.45), (s * 0.5, s * 0.9)], fill=c)
    img.save(ICON, sizes=[(16, 16), (24, 24), (32, 32), (48, 48),
                          (64, 64), (128, 128), (256, 256)])
    print("creato:", ICON)


def main():
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        print("Installo PyInstaller…")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    make_ico()

    subprocess.check_call([
        sys.executable, "-m", "PyInstaller",
        "--noconfirm", "--clean",
        "--onefile",
        "--windowed",                       # niente finestra console (app da tray)
        "--name", APP,
        "--icon", ICON,
        "--hidden-import", "pystray._win32",
        os.path.join(HERE, "main.py"),
    ])

    exe = os.path.join(HERE, "dist", APP + ".exe")
    print("\n" + "=" * 50)
    print("Fatto:", exe)
    print("Copialo dove vuoi ed eseguilo: parte in tray.")
    print("Per l'avvio con Windows usa la voce nel menu della tray.")


if __name__ == "__main__":
    main()
