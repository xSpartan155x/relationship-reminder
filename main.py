"""
Reminder Fidanzamento - app con icona nella System Tray (Windows).

- Dal menu della tray si imposta la data di inizio fidanzamento (date picker a calendario).
- Popup di auguri per il "mesiversario" (ogni mese, stesso giorno) e per l'anniversario.
- Impostazioni personalizzabili dalla tray: cosa ricordare, a che ora, suono.
- Il popup compare all'orario notturno scelto e/o al primo avvio dopo l'orario mattutino.
- Opzione per avviarsi automaticamente con Windows.

Avvio:  pythonw main.py
"""

import os
import sys
import json
import queue
import random
import socket
import calendar
import threading
from datetime import datetime, date

import tkinter as tk
from tkinter import ttk

import pystray
from PIL import Image, ImageDraw

try:
    import winreg
except ImportError:
    winreg = None

try:
    import winsound
except ImportError:
    winsound = None


APP_NAME = "FidanzamentoReminder"
APP_TITLE = "Reminder Fidanzamento"
LOCK_PORT = 50617
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"

# --- palette ---------------------------------------------------------------
TRANSPARENT = "#FF00FE"
CARD_BG = "#FFFFFF"
INK = "#4A3540"
INK_SOFT = "#8A7480"
ACCENT = "#E84A7F"
ACCENT_DK = "#D12D66"
BLUSH = "#FFE1EC"
BLUSH_LINE = "#F6C9DA"
HEART = "#F7B7CE"
OFF = "#DDD0D8"
FONT = "Segoe UI"
FONT_EMOJI = "Segoe UI Emoji"

IT_MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
             "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]
IT_WD = ["L", "M", "M", "G", "V", "S", "D"]

DEFAULTS = {
    "notify_month": True,
    "notify_anniv": True,
    "trigger_night": True,
    "trigger_morning": True,
    "night_time": "00:00",
    "morning_time": "08:00",
    "sound": True,
}


# --------------------------------------------------------------------------
# Configurazione
# --------------------------------------------------------------------------
def app_dir():
    base = os.environ.get("APPDATA") or os.path.expanduser("~")
    d = os.path.join(base, APP_NAME)
    os.makedirs(d, exist_ok=True)
    return d


CONFIG_PATH = os.path.join(app_dir(), "config.json")


def load_config():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_config(cfg):
    tmp = CONFIG_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)
    os.replace(tmp, CONFIG_PATH)


def get_setting(key):
    return load_config().get(key, DEFAULTS[key])


def set_setting(key, value):
    cfg = load_config()
    cfg[key] = value
    save_config(cfg)


def parse_hhmm(s):
    try:
        hh, mm = str(s).split(":")
        return max(0, min(23, int(hh))), max(0, min(59, int(mm)))
    except Exception:
        return 0, 0


# --------------------------------------------------------------------------
# Istanza singola
# --------------------------------------------------------------------------
_lock_socket = None


def acquire_single_instance():
    global _lock_socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", LOCK_PORT))
        s.listen(1)
    except OSError:
        return False
    _lock_socket = s
    return True


# --------------------------------------------------------------------------
# Ricorrenze
# --------------------------------------------------------------------------
def clamp_day(year, month, day):
    return min(day, calendar.monthrange(year, month)[1])


def months_between(start, d):
    return (d.year - start.year) * 12 + (d.month - start.month)


def occasion_for(start, d):
    if d <= start:
        return None
    if d.day != clamp_day(d.year, d.month, start.day):
        return None
    n = months_between(start, d)
    if n <= 0:
        return None
    if n % 12 == 0:
        return {"type": "anniv", "count": n // 12, "months": n}
    return {"type": "month", "count": n, "months": n}


def next_monthiversary(start, today):
    y, m = today.year, today.month
    for _ in range(14):
        d = date(y, m, clamp_day(y, m, start.day))
        if d >= today and d > start:
            return d
        m += 1
        if m > 12:
            m, y = 1, y + 1
    return None


def next_anniversary(start, today):
    y = today.year
    for _ in range(3):
        d = date(y, start.month, clamp_day(y, start.month, start.day))
        if d >= today and d > start:
            return d
        y += 1
    return None


def fmt_duration(months):
    years, rem = divmod(months, 12)
    parts = []
    if years:
        parts.append(f"{years} anno" if years == 1 else f"{years} anni")
    if rem:
        parts.append(f"{rem} mese" if rem == 1 else f"{rem} mesi")
    return " e ".join(parts) if parts else "0 mesi"


def fmt_date(d):
    return d.strftime("%d/%m/%Y")


def trigger_due(now_min, night_on, night_min, morn_on, morn_min):
    """True se e' il momento di mostrare l'augurio (di oggi, non ancora mostrato)."""
    if morn_on and now_min >= morn_min:
        return True
    if night_on:
        upper = morn_min if morn_on else 24 * 60
        if night_min <= upper:
            if night_min <= now_min < upper:
                return True
        else:  # orario notturno oltre quello mattutino: finestra a cavallo di mezzanotte
            if now_min >= night_min or (morn_on and now_min < morn_min):
                return True
    return False


# --------------------------------------------------------------------------
# Autostart
# --------------------------------------------------------------------------
def _run_command():
    if getattr(sys, "frozen", False):
        return f'"{sys.executable}"'
    pyw = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
    exe = pyw if os.path.exists(pyw) else sys.executable
    return f'"{exe}" "{os.path.abspath(__file__)}"'


def get_autostart():
    if winreg is None:
        return False
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as k:
            value, _ = winreg.QueryValueEx(k, APP_NAME)
            return bool(value)
    except OSError:
        return False


def set_autostart(enable):
    if winreg is None:
        return
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as k:
        if enable:
            winreg.SetValueEx(k, APP_NAME, 0, winreg.REG_SZ, _run_command())
        else:
            try:
                winreg.DeleteValue(k, APP_NAME)
            except OSError:
                pass


# --------------------------------------------------------------------------
# GUI
# --------------------------------------------------------------------------
gui_queue = queue.Queue()
stop_event = threading.Event()
root = None
icon = None


def process_queue():
    try:
        while True:
            fn = gui_queue.get_nowait()
            try:
                fn()
            except Exception as e:
                print("GUI task error:", e)
    except queue.Empty:
        pass
    root.after(200, process_queue)


def beep():
    if winsound is not None and get_setting("sound"):
        try:
            winsound.MessageBeep(winsound.MB_ICONASTERISK)
        except Exception:
            pass


def init_style():
    style = ttk.Style()
    try:
        style.theme_use("clam")
    except tk.TclError:
        pass
    style.configure("Cute.TSpinbox", arrowsize=13, padding=5,
                    fieldbackground="#FFF4F8", background="#FFF4F8",
                    bordercolor=BLUSH_LINE, lightcolor=BLUSH_LINE, darkcolor=BLUSH_LINE,
                    foreground=INK, relief="flat", font=(FONT, 11))


# --- primitive -----------------------------------------------------------
def round_rect(cv, x1, y1, x2, y2, r, **kw):
    pts = [
        x1 + r, y1, x1 + r, y1, x2 - r, y1, x2 - r, y1, x2, y1,
        x2, y1 + r, x2, y1 + r, x2, y2 - r, x2, y2 - r, x2, y2,
        x2 - r, y2, x2 - r, y2, x1 + r, y2, x1 + r, y2, x1, y2,
        x1, y2 - r, x1, y2 - r, x1, y1 + r, x1, y1 + r, x1, y1,
    ]
    return cv.create_polygon(pts, smooth=True, **kw)


def styled_window(w, h):
    win = tk.Toplevel(root)
    win.overrideredirect(True)
    win.attributes("-topmost", True)
    try:
        win.attributes("-alpha", 0.0)
    except tk.TclError:
        pass
    bg = TRANSPARENT
    try:
        win.attributes("-transparentcolor", TRANSPARENT)
    except tk.TclError:
        bg = CARD_BG
    win.configure(bg=bg)
    cv = tk.Canvas(win, width=w, height=h, bg=bg, highlightthickness=0)
    cv.pack()
    return win, cv


M = 3   # margine esterno della card (piccolo per non mostrare lo sfondo dietro)
RAD = 15


def card_base(cv, w, h, header_h=0):
    """Disegna la card. header_h = coordinata Y in cui finisce la fascia rosa (0 = niente fascia)."""
    round_rect(cv, M, M, w - M, h - M, RAD, fill=CARD_BG, outline=BLUSH_LINE, width=2)
    if header_h:
        round_rect(cv, M, M, w - M, header_h, RAD, fill=BLUSH, outline="")
        cv.create_rectangle(M, header_h - RAD, w - M, header_h, fill=BLUSH, outline="")
        cv.create_line(M, header_h, w - M, header_h, fill=BLUSH_LINE)


def place_center(win, w, h):
    sw, sh = win.winfo_screenwidth(), win.winfo_screenheight()
    win.geometry(f"{w}x{h}+{(sw - w) // 2}+{(sh - h) // 2}")


def make_draggable(win, *widgets):
    st = {"x": 0, "y": 0}

    def press(e):
        st["x"], st["y"] = e.x, e.y

    def drag(e):
        win.geometry(f"+{win.winfo_x() + e.x - st['x']}+{win.winfo_y() + e.y - st['y']}")

    for wdg in widgets:
        wdg.bind("<Button-1>", press, add="+")
        wdg.bind("<B1-Motion>", drag, add="+")


def fade_in(win, step=0.12):
    def _f():
        if not win.winfo_exists():
            return
        a = min(1.0, win.attributes("-alpha") + step)
        win.attributes("-alpha", a)
        if a < 1.0:
            win.after(16, _f)
    _f()


def fade_close(win, step=0.16):
    def _f():
        if not win.winfo_exists():
            return
        a = win.attributes("-alpha") - step
        if a <= 0:
            win.destroy()
            return
        win.attributes("-alpha", a)
        win.after(16, _f)
    _f()


def pill_button(cv, cx, cy, w, h, text, command,
                base=ACCENT, hover=ACCENT_DK, fg="white"):
    shape = round_rect(cv, cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, h / 2,
                       fill=base, outline="")
    label = cv.create_text(cx, cy, text=text, fill=fg, font=(FONT, 10, "bold"))
    tag = f"btn{shape}"
    cv.addtag_withtag(tag, shape)
    cv.addtag_withtag(tag, label)
    cv.tag_bind(tag, "<Enter>", lambda e: (cv.itemconfig(shape, fill=hover), cv.config(cursor="hand2")))
    cv.tag_bind(tag, "<Leave>", lambda e: (cv.itemconfig(shape, fill=base), cv.config(cursor="")))
    cv.tag_bind(tag, "<Button-1>", lambda e: command())
    return tag


def floating_hearts(win, cv, w, h):
    hearts = []
    for _ in range(7):
        hearts.append([random.randint(20, w - 20), random.randint(0, h),
                       random.choice((5, 6, 8)), random.uniform(0.4, 1.1),
                       [cv.create_oval(0, 0, 0, 0, fill=HEART, outline=""),
                        cv.create_oval(0, 0, 0, 0, fill=HEART, outline=""),
                        cv.create_polygon(0, 0, 0, 0, 0, 0, fill=HEART, outline="", smooth=True)]])

    def frame():
        if not win.winfo_exists():
            return
        for hd in hearts:
            hd[1] -= hd[3]
            if hd[1] < -12:
                hd[1] = h + 12
                hd[0] = random.randint(20, w - 20)
            x, y, s = hd[0], hd[1], hd[2]
            a, b, c = hd[4]
            cv.coords(a, x - s, y - s, x, y)
            cv.coords(b, x, y - s, x + s, y)
            cv.coords(c, x - s, y - s / 3, x + s, y - s / 3, x, y + s)
            for it in (a, b, c):
                cv.tag_lower(it)
        win.after(40, frame)

    frame()


class Switch(tk.Canvas):
    def __init__(self, parent, value, command):
        super().__init__(parent, width=48, height=26, bg=CARD_BG,
                         highlightthickness=0, cursor="hand2")
        self.value = bool(value)
        self.command = command
        self.bind("<Button-1>", self._toggle)
        self._draw()

    def _draw(self):
        self.delete("all")
        round_rect(self, 2, 3, 46, 23, 10, fill=ACCENT if self.value else OFF, outline="")
        kx = 35 if self.value else 13
        self.create_oval(kx - 8, 5, kx + 8, 21, fill="white", outline="")

    def _toggle(self, _e):
        self.value = not self.value
        self._draw()
        self.command(self.value)


# --- calendario ----------------------------------------------------------
class CalendarPicker:
    CW, CH = 300, 262

    def __init__(self, parent, initial, on_pick):
        self.selected = initial
        self.vy, self.vm = initial.year, initial.month
        self.on_pick = on_pick
        self.cv = tk.Canvas(parent, width=self.CW, height=self.CH,
                            bg=CARD_BG, highlightthickness=0, cursor="hand2")
        self.cv.bind("<Button-1>", self._click)
        self._cells = []
        self._render()

    def widget(self):
        return self.cv

    def _render(self):
        cv, w = self.cv, self.CW
        cv.delete("all")
        cv.create_text(w / 2, 20, text=f"{IT_MONTHS[self.vm - 1]} {self.vy}",
                       fill=ACCENT_DK, font=(FONT, 12, "bold"))
        for txt, x in (("«", 26), ("‹", 66), ("›", w - 66), ("»", w - 26)):
            cv.create_text(x, 20, text=txt, fill=INK_SOFT, font=(FONT, 13, "bold"))

        x0, cellw = 16, (w - 32) / 7
        for i, d in enumerate(IT_WD):
            cv.create_text(x0 + cellw * (i + 0.5), 48, text=d,
                           fill=INK_SOFT, font=(FONT, 9, "bold"))

        weeks = calendar.Calendar(firstweekday=0).monthdatescalendar(self.vy, self.vm)
        self._cells = []
        top, rowh = 66, 30
        for r, week in enumerate(weeks):
            for c, dd in enumerate(week):
                cx = x0 + cellw * (c + 0.5)
                cy = top + rowh * r + 15
                self._cells.append((cx, cy, dd))
                future = dd > date.today()
                if dd == self.selected:
                    cv.create_oval(cx - 14, cy - 14, cx + 14, cy + 14, fill=ACCENT, outline="")
                    fg = "white"
                elif dd == date.today():
                    cv.create_oval(cx - 14, cy - 14, cx + 14, cy + 14, outline=ACCENT, width=1)
                    fg = ACCENT_DK
                else:
                    fg = "#CBB9C2" if (dd.month != self.vm or future) else INK
                cv.create_text(cx, cy, text=str(dd.day), fill=fg,
                               font=(FONT, 10, "bold" if dd == self.selected else "normal"))

    def _shift(self, dm=0, dy=0):
        m = self.vm - 1 + dm
        self.vy += dy + m // 12
        self.vm = m % 12 + 1
        self._render()

    def _click(self, e):
        if e.y < 34:
            if e.x < 46:
                self._shift(dy=-1)
            elif e.x > self.CW - 46:
                self._shift(dy=1)
            elif e.x < 96:
                self._shift(dm=-1)
            elif e.x > self.CW - 96:
                self._shift(dm=1)
            return
        best, bd = None, 1e9
        for cx, cy, dd in self._cells:
            d2 = (e.x - cx) ** 2 + (e.y - cy) ** 2
            if d2 < bd:
                bd, best = d2, dd
        if best and bd < 260 and best <= date.today():
            self.selected = best
            self.vy, self.vm = best.year, best.month
            self._render()
            self.on_pick(best)


# --- popup auguri ------------------------------------------------------------
def show_greeting(occ):
    beep()
    anniv = occ["type"] == "anniv"
    if anniv:
        emoji, title = "🎉", f"Buon {occ['count']}° Anniversario!"
        body = (f"Oggi festeggiate {fmt_duration(occ['months'])} insieme. 💍\n"
                "Fai gli auguri e regala un momento speciale.")
    else:
        emoji, title = "💗", f"{occ['count']}° Mesiversario"
        body = (f"Oggi fate {fmt_duration(occ['months'])} insieme.\n"
                "Un messaggio dolce o una piccola sorpresa? 🌹")

    w, h = 400, 340
    win, cv = styled_window(w, h)
    card_base(cv, w, h, header_h=100)
    if anniv:
        floating_hearts(win, cv, w, h)

    cx = w // 2 - 2
    cv.create_oval(cx - 34, 24, cx + 34, 92, fill="white", outline=BLUSH_LINE, width=2)
    cv.create_text(cx, 58, text=emoji, font=(FONT_EMOJI, 30))
    cv.create_text(cx, 150, text=title, fill=ACCENT_DK, font=(FONT, 17, "bold"))
    cv.create_text(cx, 210, text=body, fill=INK_SOFT, font=(FONT, 11),
                   width=w - 80, justify="center")
    pill_button(cv, cx, h - 52, 150, 40, "Grazie  ❤", lambda: fade_close(win))

    close_x = cv.create_text(w - 34, 30, text="✕", fill=INK_SOFT, font=(FONT, 12, "bold"))
    cv.tag_bind(close_x, "<Enter>", lambda e: (cv.itemconfig(close_x, fill=ACCENT), cv.config(cursor="hand2")))
    cv.tag_bind(close_x, "<Leave>", lambda e: (cv.itemconfig(close_x, fill=INK_SOFT), cv.config(cursor="")))
    cv.tag_bind(close_x, "<Button-1>", lambda e: fade_close(win))

    make_draggable(win, cv)
    win.bind("<Escape>", lambda e: fade_close(win))
    place_center(win, w, h)
    fade_in(win)
    win.after(60000, lambda: win.winfo_exists() and fade_close(win))
    win.focus_force()


# --- dialog data ------------------------------------------------------------
def ask_start_date():
    cfg = load_config()
    try:
        cur = date.fromisoformat(cfg["start_date"])
    except (KeyError, ValueError):
        cur = date.today()

    w, h = 360, 480
    win, cv = styled_window(w, h)
    card_base(cv, w, h, header_h=94)
    cx = w // 2 - 2
    cv.create_text(cx, 38, text="💞", font=(FONT_EMOJI, 22))
    cv.create_text(cx, 70, text="Da quando state insieme?", fill=ACCENT_DK, font=(FONT, 13, "bold"))

    sel_var = tk.StringVar(value=f"Scelta: {fmt_date(cur)}")
    picker = CalendarPicker(win, cur, lambda d: sel_var.set(f"Scelta: {fmt_date(d)}"))
    cv.create_window(cx, 238, window=picker.widget())

    lbl = tk.Label(win, textvariable=sel_var, bg=CARD_BG, fg=INK, font=(FONT, 10, "bold"))
    cv.create_window(cx, 392, window=lbl)

    def confirm():
        d = picker.selected
        if d > date.today():
            return
        cfg2 = load_config()
        cfg2["start_date"] = d.isoformat()
        cfg2.pop("last_greeting_date", None)
        save_config(cfg2)
        refresh_menu()
        fade_close(win)
        gui_queue.put(show_summary)

    pill_button(cv, cx - 60, h - 44, 116, 40, "Salva", confirm)
    pill_button(cv, cx + 72, h - 44, 104, 40, "Annulla", lambda: fade_close(win),
                base="#F0E4EA", hover="#E6D3DC", fg=INK_SOFT)

    make_draggable(win, cv)
    win.bind("<Return>", lambda e: confirm())
    win.bind("<Escape>", lambda e: fade_close(win))
    place_center(win, w, h)
    fade_in(win)
    win.focus_force()


# --- riepilogo ------------------------------------------------------------
def show_summary():
    cfg = load_config()
    sd = cfg.get("start_date")
    if not sd:
        gui_queue.put(ask_start_date)
        return
    start = date.fromisoformat(sd)
    today = date.today()
    rows = [
        ("💘  Insieme da", fmt_duration(months_between(start, today))),
        ("📅  Fidanzati dal", fmt_date(start)),
        ("💗  Prossimo mesiversario", fmt_date(next_monthiversary(start, today))),
        ("🎉  Prossimo anniversario", fmt_date(next_anniversary(start, today))),
    ]
    w, h = 400, 336
    win, cv = styled_window(w, h)
    card_base(cv, w, h, header_h=70)
    cx = w // 2 - 2
    cv.create_text(cx, 44, text="Il vostro amore in numeri", fill=ACCENT_DK, font=(FONT, 14, "bold"))
    y = 108
    for i, (label, value) in enumerate(rows):
        cv.create_text(34, y, text=label, anchor="w", fill=INK_SOFT, font=(FONT, 10))
        cv.create_text(w - 34, y, text=value, anchor="e", fill=INK, font=(FONT, 11, "bold"))
        if i < len(rows) - 1:
            cv.create_line(34, y + 18, w - 34, y + 18, fill="#F1E3EA")
        y += 42
    pill_button(cv, cx, h - 44, 140, 40, "Chiudi", lambda: fade_close(win))
    make_draggable(win, cv)
    win.bind("<Escape>", lambda e: fade_close(win))
    place_center(win, w, h)
    fade_in(win)
    win.focus_force()


# --- impostazioni -------------------------------------------------------
def open_settings():
    content_w = 300
    header_h, footer_h = 62, 80

    # la canvas va creata PRIMA dei widget da incorporare, altrimenti li copre
    win, cv = styled_window(content_w + 44, 400)

    frm = tk.Frame(cv, bg=CARD_BG)

    def section(text):
        tk.Label(frm, text=text.upper(), bg=CARD_BG, fg=ACCENT,
                 font=(FONT, 8, "bold"), anchor="w").pack(fill="x", pady=(14, 3))

    def toggle_row(text, key):
        r = tk.Frame(frm, bg=CARD_BG)
        r.pack(fill="x", pady=5)
        tk.Label(r, text=text, bg=CARD_BG, fg=INK, font=(FONT, 10),
                 anchor="w").pack(side="left")
        Switch(r, get_setting(key),
               lambda v, k=key: (set_setting(k, v), refresh_menu())).pack(side="right")

    def time_row(text, enable_key, time_key):
        toggle_row(text, enable_key)
        r = tk.Frame(frm, bg=CARD_BG)
        r.pack(fill="x", pady=(0, 4))
        tk.Label(r, text="orario", bg=CARD_BG, fg=INK_SOFT,
                 font=(FONT, 9)).pack(side="left", padx=(18, 6))
        hh, mm = parse_hhmm(get_setting(time_key))
        hv, mv = tk.StringVar(value=f"{hh:02d}"), tk.StringVar(value=f"{mm:02d}")

        def upd(*_):
            try:
                set_setting(time_key, f"{int(hv.get()):02d}:{int(mv.get()):02d}")
            except (ValueError, TypeError):
                pass
        hv.trace_add("write", upd)
        mv.trace_add("write", upd)
        ttk.Spinbox(r, from_=0, to=23, width=3, textvariable=hv, format="%02.0f",
                    style="Cute.TSpinbox", justify="center", wrap=True).pack(side="left")
        tk.Label(r, text=":", bg=CARD_BG, fg=INK).pack(side="left", padx=3)
        ttk.Spinbox(r, from_=0, to=59, width=3, textvariable=mv, format="%02.0f",
                    style="Cute.TSpinbox", justify="center", wrap=True).pack(side="left")

    section("Cosa ricordare")
    toggle_row("Mesiversario (ogni mese)", "notify_month")
    toggle_row("Anniversario (ogni anno)", "notify_anniv")
    section("Quando avvisare")
    time_row("A mezzanotte / di notte", "trigger_night", "night_time")
    time_row("Al primo avvio del mattino", "trigger_morning", "morning_time")
    section("Altro")
    toggle_row("Suono di notifica", "sound")

    # dimensiona la finestra sul contenuto reale, cosi' non si taglia mai
    frm.update_idletasks()
    body_h = max(frm.winfo_reqheight(), 300)
    w = content_w + 44
    h = header_h + body_h + footer_h
    cv.config(width=w, height=h)

    card_base(cv, w, h, header_h=header_h)
    cx = w // 2
    cv.create_text(cx, header_h // 2 + 3, text="⚙  Impostazioni promemoria",
                   fill=ACCENT_DK, font=(FONT, 12, "bold"))
    cv.create_window(cx, header_h + 8, window=frm, anchor="n", width=content_w)
    pill_button(cv, cx, h - footer_h // 2, 150, 38, "Fatto", lambda: fade_close(win))

    make_draggable(win, cv)
    win.bind("<Escape>", lambda e: fade_close(win))
    place_center(win, w, h)
    fade_in(win)
    win.focus_force()


# --------------------------------------------------------------------------
# Tray
# --------------------------------------------------------------------------
def make_icon_image():
    s = 256
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = (232, 74, 127, 255)
    d.ellipse((s * 0.10, s * 0.16, s * 0.54, s * 0.60), fill=c)
    d.ellipse((s * 0.46, s * 0.16, s * 0.90, s * 0.60), fill=c)
    d.polygon([(s * 0.13, s * 0.45), (s * 0.87, s * 0.45), (s * 0.5, s * 0.9)], fill=c)
    return img.resize((64, 64), Image.LANCZOS)


def _toggle(key):
    def handler(_icon, _item):
        set_setting(key, not get_setting(key))
        refresh_menu()
    return handler


def on_set_date(_i, _it):
    gui_queue.put(ask_start_date)


def on_summary(_i, _it):
    gui_queue.put(show_summary)


def on_settings(_i, _it):
    gui_queue.put(open_settings)


def on_test(_i, _it):
    gui_queue.put(lambda: show_greeting({"type": "month", "count": 7, "months": 7}))


def on_toggle_autostart(_i, _it):
    set_autostart(not get_autostart())
    refresh_menu()


def on_quit(_icon, _it):
    stop_event.set()
    _icon.stop()
    gui_queue.put(root.quit)


def build_menu():
    return pystray.Menu(
        pystray.MenuItem("Riepilogo", on_summary, default=True),
        pystray.MenuItem("Imposta data fidanzamento…", on_set_date),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Ricorda il mesiversario", _toggle("notify_month"),
                         checked=lambda _i: get_setting("notify_month")),
        pystray.MenuItem("Ricorda l'anniversario", _toggle("notify_anniv"),
                         checked=lambda _i: get_setting("notify_anniv")),
        pystray.MenuItem("Avviso a mezzanotte", _toggle("trigger_night"),
                         checked=lambda _i: get_setting("trigger_night")),
        pystray.MenuItem("Avviso al mattino", _toggle("trigger_morning"),
                         checked=lambda _i: get_setting("trigger_morning")),
        pystray.MenuItem("Suono", _toggle("sound"),
                         checked=lambda _i: get_setting("sound")),
        pystray.MenuItem("Impostazioni…", on_settings),
        pystray.MenuItem("Mostra augurio di prova", on_test),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Avvio automatico con Windows", on_toggle_autostart,
                         checked=lambda _i: get_autostart()),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Esci", on_quit),
    )


def refresh_menu():
    if icon is not None:
        icon.menu = build_menu()
        try:
            icon.update_menu()
        except Exception:
            pass


# --------------------------------------------------------------------------
# Loop di controllo
# --------------------------------------------------------------------------
def checker_loop():
    while not stop_event.is_set():
        try:
            cfg = load_config()
            sd = cfg.get("start_date")
            if sd:
                start = date.fromisoformat(sd)
                now = datetime.now()
                today = now.date()
                occ = occasion_for(start, today)
                if occ and occ["type"] == "month" and not get_setting("notify_month"):
                    occ = None
                if occ and occ["type"] == "anniv" and not get_setting("notify_anniv"):
                    occ = None
                already = cfg.get("last_greeting_date") == today.isoformat()
                if occ and not already:
                    nh, nm = parse_hhmm(get_setting("night_time"))
                    mh, mm = parse_hhmm(get_setting("morning_time"))
                    if trigger_due(now.hour * 60 + now.minute,
                                   get_setting("trigger_night"), nh * 60 + nm,
                                   get_setting("trigger_morning"), mh * 60 + mm):
                        gui_queue.put(lambda o=occ: show_greeting(o))
                        cfg["last_greeting_date"] = today.isoformat()
                        save_config(cfg)
        except Exception as e:
            print("checker error:", e)
        stop_event.wait(30)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
def main():
    global root, icon
    if not acquire_single_instance():
        print(APP_TITLE, "e' gia' in esecuzione.")
        return

    root = tk.Tk()
    root.withdraw()
    root.title(APP_TITLE)
    init_style()

    icon = pystray.Icon(APP_NAME, make_icon_image(), APP_TITLE, menu=build_menu())
    threading.Thread(target=icon.run, daemon=True).start()
    threading.Thread(target=checker_loop, daemon=True).start()

    if not load_config().get("start_date"):
        gui_queue.put(ask_start_date)

    root.after(200, process_queue)
    try:
        root.mainloop()
    finally:
        stop_event.set()
        try:
            icon.stop()
        except Exception:
            pass


if __name__ == "__main__":
    main()
