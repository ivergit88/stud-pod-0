# -*- coding: utf-8 -*-
"""Builds the 8-slide «Студенческий подряд» deck per the text TZ."""
import os
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE
from ppt_helpers import *

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets")

def asset(n): return os.path.join(A, n)

# ---------------------------------------------------------------- SLIDE 1
def slide1(prs):
    s = blank(prs)
    nav(s, 0)
    # left column
    add_text(s, 0.75, 0.78, 6.4, 0.3, [T("ТВОЙ ХОД · ТРЕК «ДЕЛАЮ»", 9, GRAYBLU, True, ls=1.2)])
    add_text(s, 0.75, 1.06, 6.6, 1.3, [
        T("СТУДЕНЧЕСКИЙ", 38, INK, True, after=2),
        T("ПОДРЯД", 38, BLUE, True)])
    add_text(s, 0.75, 2.42, 6.4, 0.8, [
        T("Межвузовская экосистема", 15, GRAYBLU, False, after=1),
        T("первого профессионального опыта", 15, GRAYBLU, False)])
    rect(s, 0.75, 3.32, 1.85, 0.34, fill=BLUE, radius=0.4)
    add_text(s, 0.75, 3.32, 1.85, 0.34, [T("ЦЕЛЕВАЯ АУДИТОРИЯ", 8.5, WHITE, True, "c")], anchor="middle")
    add_text(s, 0.75, 3.76, 6.6, 0.3, [
        T("СТУДЕНТЫ 1–3 КУРСОВ · IT · ДИЗАЙН · МЕДИА ↔ УЧРЕЖДЕНИЯ КУЛЬТУРЫ", 9.5, INK, True)])
    add_text(s, 0.75, 4.2, 6.6, 0.8, [
        T("Учреждению — цифровое решение.", 14, INK, True, after=2),
        T("Студенту — первый реальный внешний кейс.", 14, BLUE, True)])
    # metrics
    mx = [0.75, 2.95, 5.05]
    vals = [("64", "участника", BLUE), ("12", "задач", GREEN), ("3", "учреждения", PURPLE)]
    for i, (v, l, c) in enumerate(vals):
        if i: line(s, mx[i] - 0.22, 5.15, mx[i] - 0.22, 6.15, BORDER, 1)
        add_text(s, mx[i], 5.05, 1.9, 0.7, [T(v, 32, c, True)])
        add_text(s, mx[i], 5.82, 1.9, 0.3, [T(l, 10, GRAY, False)])
    # right zone
    add_text(s, 8.3, 0.72, 2.6, 0.25, [T("ГЛАВНАЯ", 7.5, GRAY, True, ls=1.1)])
    rect(s, 10.95, 0.68, 1.75, 0.3, fill=CARDGRN, radius=0.4)
    add_text(s, 10.95, 0.68, 1.75, 0.3, [T("ДЕЙСТВУЮЩИЙ ПРОДУКТ", 7.5, GREEN, True, "c")], anchor="middle")
    add_text(s, 8.3, 0.98, 4.4, 0.22, [T("запрос учреждения → микро-задача → реальный результат", 7.5, GRAYBLU, False, "r")])
    picture(s, asset("ui_home.png"), 8.3, 1.24, w=4.4)
    add_text(s, 7.45, 4.62, 2.5, 0.22, [T("КАТАЛОГ", 7.5, GRAY, True, ls=1.1)])
    add_text(s, 10.15, 4.62, 2.6, 0.22, [T("КАРТОЧКА ЗАДАЧИ", 7.5, GRAY, True, ls=1.1)])
    picture(s, asset("ui_catalog.png"), 7.45, 4.86, w=2.5)
    picture(s, asset("ui_task.png"), 10.15, 4.86, w=2.5)
    # QR
    qr = make_qr("https://xn----gtbba2cfjcjk2l.xn--p1ai/", asset("qr_portal.png"))
    rect(s, 7.4, 6.06, 1.06, 1.06, fill=WHITE, line=BORDER, radius=0.06)
    picture(s, qr, 7.43, 6.09, w=1.0)
    add_text(s, 8.62, 6.2, 3.6, 0.6, [
        T("Открыть портал", 10.5, INK, True, after=1),
        T("студ-подряд.рф", 11, BLUE, True)])
    footer(s, "Иван Ершов · ID 2234178 · трек «Делаю»", "01 / 08", prefix="")

# ---------------------------------------------------------------- SLIDE 2
def slide2(prs):
    s = blank(prs)
    nav(s, 0)
    add_text(s, 0.75, 0.62, 11.0, 0.5, [T("Проблема не придумана. Она измерена.", 22, INK, True)])
    # left card
    rect(s, 0.75, 1.3, 7.3, 5.3, fill=CARDBLU2, radius=0.03)
    add_text(s, 1.05, 1.5, 2.4, 0.8, [T("1 262", 36, BLUE, True)])
    add_text(s, 3.4, 1.62, 4.4, 0.7, [
        T("анкеты · совместное исследование", 10.5, INK, True, after=1),
        T("с Экспертным центром «Твой Ход»", 10.5, GRAYBLU, False)])
    rect(s, 1.05, 2.5, 6.7, 0.95, fill=WHITE, radius=0.05)
    add_text(s, 1.25, 2.6, 3.0, 0.25, [T("ФОКУСНЫЙ СРЕЗ", 8, BLUE, True, ls=1.2)])
    add_text(s, 1.25, 2.85, 4.6, 0.35, [T("649 студентов 1–3 курсов вузов", 12.5, INK, True)])
    add_text(s, 1.25, 3.18, 6.2, 0.25, [T("ключевой курсовой сегмент целевой аудитории проекта", 7.5, GRAY, False)])
    donuts = [
        (12.3, "имеют реальный проект внешнего заказчика", BLUE),
        (43.8, "не знают, где искать первую реальную задачу", ORANGE),
        (43.5, "не уверены, что практических навыков достаточно", PURPLE),
        (31.4, "сложно совмещать длительные форматы практики с учёбой", CYAN),
    ]
    pos = [(1.1, 3.75), (4.55, 3.75), (1.1, 5.15), (4.55, 5.15)]
    for (v, label, c), (dx, dy) in zip(donuts, pos):
        donut(s, dx, dy, 1.05, v, c)
        add_text(s, dx, dy + 0.32, 1.05, 0.4, [T(f"{str(v).replace('.', ',')}%", 11, c, True, "c")], anchor="middle")
        add_text(s, dx + 1.2, dy + 0.12, 2.15, 0.9, [T(label, 8.5, GRAYBLU, False)])
    # right card
    rect(s, 8.3, 1.3, 4.3, 5.3, fill=WHITE, line=BORDER, radius=0.03)
    circ = rect(s, 1.05 + 7.5, 1.55, 0.42, 0.42, fill=GREEN, radius=0.5, shape_type=MSO_SHAPE.OVAL)
    add_text(s, 8.55, 1.55, 0.42, 0.42, [T("+", 16, WHITE, True, "c")], anchor="middle")
    add_text(s, 9.15, 1.52, 2.6, 0.6, [T("1 464", 28, GREEN, True)])
    add_text(s, 9.15, 2.1, 2.6, 0.3, [T("респондента", 11, INK, True)])
    add_text(s, 9.15, 2.42, 3.2, 0.55, [
        T("Второе исследование", 9.5, GRAYBLU, False, after=1),
        T("Экспертного центра", 9.5, GRAYBLU, False)])
    rect(s, 8.6, 3.2, 3.7, 0.34, fill=CARDPUR, radius=0.4)
    add_text(s, 8.6, 3.2, 3.7, 0.34, [T("ПРЕДСТАВЛЕНЫ 8 ФЕДЕРАЛЬНЫХ ОКРУГОВ", 7.5, PURPLE, True, "c")], anchor="middle")
    line(s, 8.6, 3.85, 12.3, 3.85, BORDER, 1)
    add_text(s, 8.6, 4.05, 3.7, 0.4, [T("2 исследования", 13, INK, True)])
    add_text(s, 8.6, 4.45, 3.7, 0.4, [T("2 726 анкет*", 13, BLUE, True)])
    add_text(s, 8.6, 4.85, 3.7, 0.3, [T("*две отдельные выборки", 7.5, GRAY, False)])
    footer(s, "Совместное исследование с Экспертным центром «Твой Ход»; второе исследование n=1 464.", "02 / 08")

# ---------------------------------------------------------------- SLIDE 3
def slide3(prs):
    s = blank(prs)
    nav(s, 0)
    add_text(s, 0.75, 0.62, 11.5, 0.45, [T("Всё от запроса до кейса внутри одной экосистемы", 20, INK, True)])
    add_text(s, 0.75, 1.02, 11.5, 0.3, [T("Платформа снижает входной барьер и ведёт обе стороны через полный рабочий цикл", 10.5, GRAYBLU, False)])
    rect(s, 3.5, 1.35, 6.4, 4.75, fill=WHITE, line=BORDER, radius=0.02)
    picture(s, asset("ui_home.png"), 3.68, 1.42, w=6.05)
    steps = [
        ("01", "ЗАПРОС УЧРЕЖДЕНИЯ", "учреждение описывает потребность обычными словами", None),
        ("02", "ИИ + МОДЕРАЦИЯ", "запрос превращается в понятную задачу или набор микро-задач", "базовый путь работает и без ИИ"),
        ("03", "КАРТОЧКА ЗАДАЧИ", "результат · срок · сложность · баллы · материалы", None),
        ("04", "ОДИН ИЛИ В КОМАНДЕ", "можно выполнить самостоятельно или найти сокомандников", None),
        ("05", "ПРОВЕРКА И ДОРАБОТКА", "сдача → обратная связь → корректировка результата", None),
        ("06", "КЕЙС + БАЛЛЫ", "принятый результат фиксируется в истории участника на платформе и может использоваться в портфолио", None),
    ]
    ys = [1.35, 2.98, 4.61]
    for i, (n, t, body, extra) in enumerate(steps[:3]):
        callout(s, 0.6, ys[i], 2.95, 1.48, n, t, body, extra, right=True)
    for i, (n, t, body, extra) in enumerate(steps[3:]):
        callout(s, 9.85, ys[i], 2.95, 1.48, n, t, body, extra, right=False)
    # flow connectors
    for yy in (2.8, 4.43):
        add_text(s, 1.75, yy, 0.5, 0.2, [T("↓", 9, BLUE, True, "c")], anchor="middle")
        add_text(s, 11.05, yy, 0.5, 0.2, [T("↓", 9, BLUE, True, "c")], anchor="middle")
    line(s, 2.1, 6.14, 2.1, 6.3, BLUE, 1.2)
    line(s, 2.1, 6.3, 11.3, 6.3, BLUE, 1.2, dash=True)
    line(s, 11.3, 6.3, 11.3, 6.14, BLUE, 1.2)
    add_text(s, 11.05, 5.95, 0.5, 0.25, [T("↑", 10, BLUE, True, "c")])
    # bottom metrics
    stats = [("60,1%", "нужен чёткий результат", BLUE), ("51,3%", "понятный срок", PURPLE),
             ("47,1%", "примеры", CYAN), ("88,9%", "готовы рассмотреть такой формат", GREEN)]
    sx = 0.75
    for v, l, c in stats:
        add_text(s, sx, 6.42, 1.6, 0.32, [T(v, 13, c, True)])
        add_text(s, sx, 6.74, 1.65, 0.35, [T(l, 7, GRAYBLU, False)])
        sx += 1.62
    # green card
    rect(s, 7.35, 6.38, 5.25, 0.72, fill=CARDGRN, radius=0.05)
    add_text(s, 7.5, 6.43, 5.0, 0.24, [T("ПРАКТИКО-ОРИЕНТИРОВАННОЕ ВОВЛЕЧЕНИЕ", 8, GREEN, True)])
    add_text(s, 7.5, 6.65, 3.0, 0.42, [
        T("Не заменяет практику вуза. Даёт добровольный опыт работы с реальным внешним заказчиком.", 7, GRAYBLU, False)])
    add_text(s, 10.55, 6.6, 2.0, 0.5, [
        T("вуз — программа и документы практики", 6.3, GRAY, False, after=1),
        T("проект — внешняя задача, результат и кейс", 6.3, GRAY, False)])
    footer(s, "Совместное исследование с Экспертным центром «Твой Ход»; Дорожная карта проекта.", "03 / 08")

def callout(s, x, y, w, h, n, t, body, extra, right):
    rect(s, x, y, w, h, fill=WHITE, line=BORDER, radius=0.05)
    circ = rect(s, x + 0.14, y + 0.14, 0.3, 0.3, fill=BLUE, radius=0.5, shape_type=MSO_SHAPE.OVAL)
    add_text(s, x + 0.14, y + 0.14, 0.3, 0.3, [T(n, 8, WHITE, True, "c")], anchor="middle")
    add_text(s, x + 0.52, y + 0.16, w - 0.66, 0.3, [T(t, 8.5, INK, True)])
    add_text(s, x + 0.14, y + 0.52, w - 0.28, 0.7, [T(body, 7.3, GRAYBLU, False)])
    if extra:
        add_text(s, x + 0.14, y + h - 0.26, w - 0.28, 0.22, [T(extra, 6.5, GRAY, False, italic=True)])

# ---------------------------------------------------------------- SLIDE 4
def slide4(prs):
    s = blank(prs)
    nav(s, 1)
    add_text(s, 0.75, 0.62, 11.0, 0.45, [T("Результат, который можно проверить", 20, INK, True)])
    add_text(s, 0.75, 1.03, 11.0, 0.3, [T("ПЛАН → ФАКТ → ЭФФЕКТ → ПОДТВЕРЖДЕНИЕ", 9, BLUE, True, ls=1.2)])
    cards = [
        ("64", BLUE, "участника зарегистрировано", "ПЛАН ≥50"),
        ("20", PURPLE, "участников в активных ролях", "20 из 64 = 31,25%"),
        ("12", GREEN, "завершённых микро-задач", ""),
        ("3 из 3", ORANGE, "учреждений подтвердили практическую применимость", ""),
        ("85,7%", CYAN, "участников очных сессий лучше понимают путь к первому кейсу", "12 из 14 уникальных участников"),
    ]
    cw = (12.6 - 0.75 - 4 * 0.12) / 5
    x = 0.75
    for v, c, label, sub in cards:
        rect(s, x, 1.45, cw, 1.95, fill=WHITE, line=BORDER, radius=0.05)
        rect(s, x, 1.45, cw, 0.06, fill=c, radius=0.3)
        add_text(s, x + 0.14, 1.6, cw - 0.28, 0.55, [T(v, 24, c, True)])
        add_text(s, x + 0.14, 2.18, cw - 0.28, 0.7, [T(label, 8.3, GRAYBLU, False)])
        if sub:
            add_text(s, x + 0.14, 2.95, cw - 0.28, 0.3, [T(sub, 7, GRAY, False, italic=True)])
        x += cw + 0.12
    rect(s, 0.75, 3.55, 11.85, 0.36, fill=CARDBLU2, radius=0.3)
    add_text(s, 0.75, 3.55, 11.85, 0.36, [T("3 из 3 запланированных проектных сессий проведены", 9, BLUE, True, "c")], anchor="middle")
    # timeline left
    rect(s, 0.75, 4.15, 2.85, 1.35, fill=CARDBLU2, radius=0.05)
    add_text(s, 0.9, 4.25, 1.4, 0.26, [T("ПЛАН ≥10", 7.5, GRAYBLU, True)])
    add_text(s, 0.9, 4.52, 1.6, 0.4, [T("05.08", 15, INK, True)])
    add_text(s, 0.9, 4.95, 2.5, 0.5, [T("10 задач выполнены / переданы", 8, GRAYBLU, False)])
    add_text(s, 3.68, 4.6, 0.4, 0.4, [T("→", 14, BLUE, True, "c")], anchor="middle")
    rect(s, 4.1, 4.15, 2.85, 1.35, fill=CARDGRN, radius=0.05)
    add_text(s, 4.25, 4.25, 1.6, 0.26, [T("СЕЙЧАС", 7.5, GREEN, True)])
    add_text(s, 4.25, 4.52, 2.2, 0.4, [T("12 из 12", 15, GREEN, True)])
    add_text(s, 4.25, 4.95, 2.4, 0.4, [T("завершены", 8, GRAYBLU, False)])
    cities = [("Шаранга", "4 задачи"), ("Кстово", "4 задачи"), ("Арзамас", "4 задачи")]
    cx = 0.75
    for name, n in cities:
        rect(s, cx, 5.68, 1.95, 0.34, fill=WHITE, line=BORDER, radius=0.3)
        add_text(s, cx, 5.68, 1.95, 0.34, [T(f"{name} · {n}", 7.5, GRAYBLU, True, "c")], anchor="middle")
        cx += 2.07
    rect(s, 0.75, 6.18, 6.2, 0.78, fill=CARDGRN, line=GREEN, line_w=0.75, radius=0.05)
    add_text(s, 0.9, 6.26, 5.9, 0.3, [T("ВНЕШНЯЯ ЭКСПЕРТИЗА", 7.5, GREEN, True)])
    add_text(s, 0.9, 6.5, 5.9, 0.42, [T("1 веб-результат для Кстово прошёл внешнюю проверку кода экспертом НЕЙМАРК", 7.5, GRAYBLU, False)])
    # right: photos + letters
    photo_placeholder(s, 7.15, 4.15, 5.45, 1.75, "проектная сессия · аудитория", "photo: session-audience.jpg")
    photo_placeholder(s, 7.15, 6.02, 2.5, 0.94, "рабочая проверка за ноутбуком", "photo: review-laptop.jpg")
    for i in range(3):
        lx = 9.85 + i * 0.95
        rect(s, lx, 6.02, 0.82, 0.72, fill=WHITE, line=BORDER, radius=0.04)
        rect(s, lx + 0.1, 6.14, 0.5, 0.05, fill=BORDER)
        rect(s, lx + 0.1, 6.26, 0.62, 0.045, fill=BORDER)
        rect(s, lx + 0.1, 6.37, 0.62, 0.045, fill=BORDER)
        c2 = rect(s, lx + 0.52, 6.48, 0.2, 0.2, fill=BLUE, radius=0.5, shape_type=MSO_SHAPE.OVAL)
    add_text(s, 9.85, 6.78, 2.75, 0.2, [T("письма учреждений культуры", 6.3, GRAY, False, "c")])
    footer(s, "реестр микро-задач · выходные анкеты · письма учреждений · экспертное заключение", "04 / 08")

# ---------------------------------------------------------------- SLIDE 5
def slide5(prs):
    s = blank(prs)
    nav(s, 2)
    add_text(s, 0.75, 0.62, 11.5, 0.45, [T("Идея Дорожной карты сохранена. Проект продолжается.", 20, INK, True)])
    add_text(s, 0.75, 1.02, 11.5, 0.3, [T("Контрольная дата стала точкой проверки, а не точкой остановки", 10.5, GRAYBLU, False)])
    nodes = ["ГИПОТЕЗА", "РАБОЧИЙ ПОРТАЛ", "ПЕРВАЯ ВОЛНА", "3 ПРОЕКТНЫЕ СЕССИИ", "10 ЗАДАЧ К 05.08", "12 ЗАДАЧ ЗАВЕРШЕНЫ"]
    subs = ["", "", "студенты + задачи", "", "", ""]
    nw = 1.52; x = 0.75
    for i, ntxt in enumerate(nodes):
        done = i == 5
        rect(s, x, 1.5, nw, 0.85, fill=CARDGRN if done else CARDBLU2, radius=0.06)
        add_text(s, x + 0.06, 1.58, nw - 0.12, 0.35, [T(ntxt, 7.6, GREEN if done else INK, True, "c")], anchor="middle")
        if subs[i]:
            add_text(s, x + 0.06, 1.95, nw - 0.12, 0.3, [T(subs[i], 6.8, GRAYBLU, False, "c")])
        if i < 5:
            add_text(s, x + nw, 1.72, 0.16, 0.3, [T("→", 8.5, BLUE, True, "c")], anchor="middle")
        x += nw + 0.16
    # autumn card
    rect(s, 10.85, 1.35, 1.78, 1.98, fill=BLUE, radius=0.05)
    add_text(s, 10.93, 1.42, 1.62, 0.3, [T("ОСЕНЬ 2026", 9, WHITE, True, "c")])
    add_text(s, 10.93, 1.74, 1.62, 1.0, [
        T("НОВЫЕ СТУДЕНТЫ", 7.0, WHITE, True, "c", after=1),
        T("+", 7.0, WHITE, False, "c", after=1),
        T("НОВЫЕ ЗАДАЧИ", 7.0, WHITE, True, "c", after=1),
        T("+", 7.0, WHITE, False, "c", after=1),
        T("РАСШИРЕНИЕ ГЕОГРАФИИ", 7.0, WHITE, True, "c")])
    add_text(s, 10.93, 2.85, 1.62, 0.45, [T("Нижегородская область → постепенный переход к межрегиональной модели", 5.8, "CFE0FF", False)])
    # period chips
    rect(s, 0.75, 2.55, 7.9, 0.3, fill=WHITE, line=BORDER, radius=0.3)
    add_text(s, 0.75, 2.55, 7.9, 0.3, [T("05.02–05.08 · пилот", 7.5, GRAYBLU, True, "c")], anchor="middle")
    rect(s, 8.8, 2.55, 1.9, 0.3, fill=WHITE, line=BORDER, radius=0.3)
    add_text(s, 8.8, 2.55, 1.9, 0.3, [T("06.08–25.12 · развитие", 7.5, GRAYBLU, True, "c")], anchor="middle")
    # core card
    rect(s, 0.75, 3.5, 11.85, 1.6, fill=CARDBLU2, radius=0.04)
    add_text(s, 0.95, 3.62, 3.0, 0.3, [T("НЕИЗМЕННОЕ ЯДРО", 9.5, BLUE, True, ls=1.2)])
    chain = ["запрос", "задача", "выполнение", "проверка", "результат", "кейс", "отзыв"]
    cx = 0.95
    for i, ctxt in enumerate(chain):
        w = text_w(ctxt, 8, True) + 0.24
        rect(s, cx, 4.02, w, 0.34, fill=WHITE, line=BORDER, radius=0.3)
        add_text(s, cx, 4.02, w, 0.34, [T(ctxt, 8, INK, True, "c")], anchor="middle")
        cx += w
        if i < 6:
            add_text(s, cx, 4.02, 0.28, 0.34, [T("→", 8, BLUE, True, "c")], anchor="middle")
            cx += 0.28
    add_text(s, 0.95, 4.55, 7.6, 0.5, [T("полный рабочий цикл участника — без разрывов между инструментами", 7.5, GRAYBLU, False)])
    add_text(s, 9.4, 3.85, 3.1, 1.1, [
        T("Механика сохранилась.", 15, INK, True, after=2),
        T("Масштаб растёт.", 15, BLUE, True)])
    # improvements
    imp = [("ЧЕК-ЛИСТЫ + РЕГЛАМЕНТ", "стандартизация модерации", BLUE),
           ("РАСПРЕДЕЛЕНИЕ РОЛЕЙ", "операционные процессы команды", PURPLE),
           ("ФЕДЕРАЛЬНЫЕ ДАННЫЕ", "дополнительная проверка гипотезы", GREEN)]
    x = 0.75
    for t, b, c in imp:
        rect(s, x, 5.3, 3.87, 0.85, fill=WHITE, line=BORDER, radius=0.05)
        rect(s, x + 0.16, 5.46, 0.09, 0.5, fill=c, radius=0.4)
        add_text(s, x + 0.4, 5.42, 3.3, 0.3, [T(t, 8.5, INK, True)])
        add_text(s, x + 0.4, 5.72, 3.3, 0.3, [T(b, 7.5, GRAYBLU, False)])
        x += 4.0
    footer(s, "Дорожная карта проекта · этапы 05.02–25.12.2026", "05 / 08")

# ---------------------------------------------------------------- SLIDE 6
def slide6(prs):
    s = blank(prs)
    nav(s, 3)
    add_text(s, 0.75, 0.62, 11.5, 0.45, [T("Новизна в сочетании механик и экосистем", 20, INK, True)])
    add_text(s, 0.75, 1.02, 11.5, 0.3, [T("Не одна новая функция, а новый формат взаимодействия", 10.5, GRAYBLU, False)])
    # card 1
    rect(s, 0.75, 1.4, 3.95, 3.45, fill=CARDBLU2, radius=0.04)
    add_text(s, 0.95, 1.52, 3.5, 0.3, [T("ЕДИНЫЙ РАБОЧИЙ ЦИКЛ", 9.5, BLUE, True)])
    chain = ["запрос", "декомпозиция", "задача", "исполнитель / команда", "проверка", "кейс"]
    cy = 1.92
    for i, ctxt in enumerate(chain):
        rect(s, 1.15, cy, 2.9, 0.3, fill=WHITE, line=BORDER, radius=0.3)
        add_text(s, 1.15, cy, 2.9, 0.3, [T(ctxt, 7.6, INK, True, "c")], anchor="middle")
        if i < 5:
            add_text(s, 2.4, cy + 0.28, 0.4, 0.14, [T("↓", 7, BLUE, True, "c")])
        cy += 0.42
    add_text(s, 0.95, 4.5, 3.5, 0.3, [T("весь пользовательский путь в одном цифровом продукте", 6.8, GRAY, False)])
    # card 2
    rect(s, 4.9, 1.4, 3.6, 3.45, fill=CARDPUR, radius=0.04)
    add_text(s, 5.05, 1.52, 3.3, 0.3, [T("КООПЕРАЦИЯ ЭКОСИСТЕМ", 9.5, PURPLE, True)])
    circ = rect(s, 6.0, 2.75, 1.4, 1.0, fill=BLUE, radius=0.12)
    add_text(s, 6.0, 2.75, 1.4, 1.0, [T("РЕАЛЬНАЯ ЗАДАЧА", 8, WHITE, True, "c")], anchor="middle")
    sats = [("СТУДЕНТЫ", 5.95, 1.95), ("УЧРЕЖДЕНИЯ", 5.8, 3.95), ("ЭКСПЕРТЫ", 5.0, 2.95), ("ПАРТНЁРЫ", 7.5, 2.95)]
    for t, sx2, sy2 in sats:
        w = text_w(t, 6.8, True) + 0.2
        rect(s, sx2, sy2, w, 0.28, fill=WHITE, line=BORDER, radius=0.3)
        add_text(s, sx2, sy2, w, 0.28, [T(t, 6.8, INK, True, "c")], anchor="middle")
    add_text(s, 5.05, 4.45, 3.3, 0.35, [T("разные участники работают вокруг одного прикладного результата", 6.8, GRAY, False)])
    # card 3
    rect(s, 8.7, 1.4, 3.9, 3.45, fill=CARDGRN, radius=0.04)
    add_text(s, 8.85, 1.52, 3.6, 0.3, [T("КООПЕРАЦИЯ ВНУТРИ ОДНОГО КОНКУРСА", 8.6, GREEN, True)])
    rect(s, 8.9, 1.9, 3.5, 1.3, fill=WHITE, line=BORDER, radius=0.05)
    add_text(s, 9.02, 1.98, 3.26, 0.5, [
        T("Проект «Слово на равных»", 7.8, INK, True, after=1),
        T("проект «Твоего Хода» о профессиональной коммуникации", 6.6, GRAY, False)])
    add_text(s, 9.02, 2.5, 3.26, 0.3, [T("× «Студенческий подряд»", 7.2, BLUE, True)])
    add_text(s, 9.02, 2.8, 3.26, 0.3, [T("коммуникация + работа с реальным заказчиком", 6.8, GREEN, True)])
    rect(s, 8.9, 3.3, 3.5, 1.3, fill=WHITE, line=BORDER, radius=0.05)
    add_text(s, 9.02, 3.38, 3.26, 0.5, [
        T("Проект «Народы Нижегородской области»", 7.8, INK, True, after=1),
        T("проект «Твоего Хода» о культуре народов региона через настольную игру", 6.6, GRAY, False)])
    add_text(s, 9.02, 3.92, 3.26, 0.3, [T("× «Студенческий подряд»", 7.2, BLUE, True)])
    add_text(s, 9.02, 4.22, 3.26, 0.3, [T("культура офлайн + цифровые решения", 6.8, GREEN, True)])
    # phrase + skills
    add_text(s, 0.75, 5.0, 11.85, 0.4, [T("КОНКУРИРУЕМ ИДЕЯМИ. СОТРУДНИЧАЕМ РАДИ РЕЗУЛЬТАТА.", 14, INK, True, "c")])
    skills = ["понимать заказчика", "работать в команде", "взаимодействовать с другой сферой", "доводить результат"]
    sx = 1.6
    for t in skills:
        w = text_w(t, 7.5, False) + 0.3
        rect(s, sx, 5.47, 0.12, 0.12, fill=BLUE, radius=0.5, shape_type=MSO_SHAPE.OVAL)
        add_text(s, sx + 0.18, 5.42, w, 0.25, [T(t, 7.5, GRAYBLU, False)])
        sx += w + 0.55
    # sphere frame
    rect(s, 0.75, 5.82, 11.85, 0.92, fill=WHITE, line=BORDER, radius=0.04)
    rect(s, 0.9, 5.72, 1.7, 0.28, fill=CARDBLU, radius=0.3)
    add_text(s, 0.9, 5.72, 1.7, 0.28, [T("СФЕРА ПРИМЕНЕНИЯ", 7.5, BLUE, True, "c")], anchor="middle")
    add_text(s, 0.95, 6.0, 1.2, 0.3, [T("Сейчас:", 8, INK, True)])
    add_text(s, 0.95, 6.26, 5.6, 0.45, [T("практико-ориентированный опыт студентов + цифровые задачи учреждений культуры", 7.3, GRAYBLU, False)])
    add_text(s, 6.9, 6.0, 2.0, 0.3, [T("Потенциал развития:", 8, INK, True)])
    add_text(s, 6.9, 6.26, 5.6, 0.45, [T("другие муниципальные и социальные организации с небольшими цифровыми запросами", 7.3, GRAYBLU, False)])
    # federal strip
    rect(s, 0.75, 6.84, 11.85, 0.26, fill=CARDBLU, radius=0.2)
    add_text(s, 0.75, 6.84, 11.85, 0.26, [T("ФЕДЕРАЛЬНЫЙ КОНТЕКСТ · Указ №309 · «Молодёжь и дети» · «Экономика данных» · «Семья»", 7, GRAYBLU, True, "c")], anchor="middle")
    footer(s, "Дорожная карта · материалы коллабораций · письма партнёров · федеральные документы", "06 / 08")

# ---------------------------------------------------------------- SLIDE 7
def slide7(prs):
    s = blank(prs)
    nav(s, 4)
    add_text(s, 0.75, 0.62, 11.5, 0.45, [T("Личный вклад лидера: решения, ответственность, результат", 20, INK, True)])
    add_text(s, 0.75, 1.02, 11.5, 0.3, [T("От идеи и продукта до заказчика и принятого результата", 10.5, GRAYBLU, False)])
    # leader card
    rect(s, 0.75, 1.4, 6.95, 5.55, fill=CARDBLU2, line=BORDER, radius=0.03)
    rect(s, 0.95, 1.6, 0.85, 0.85, fill=BLUE, radius=0.5, shape_type=MSO_SHAPE.OVAL)
    add_text(s, 0.95, 1.6, 0.85, 0.85, [T("ИЕ", 16, WHITE, True, "c")], anchor="middle")
    add_text(s, 2.0, 1.62, 5.4, 0.4, [T("Ершов Иван Сергеевич", 15, INK, True)])
    add_text(s, 2.0, 2.0, 5.4, 0.3, [T("Лидер · ID 2234178", 9, BLUE, True)])
    add_text(s, 2.0, 2.3, 5.5, 0.45, [T("Личная ответственность за продукт, заказчиков, качество и итоговый результат", 8, GRAYBLU, False)])
    funcs = [
        ("ПРОДУКТ", ["продуктовая модель", "+ архитектура портала"], BLUE),
        ("РАЗРАБОТКА", ["портал", "+ пользовательские сценарии"], CYAN),
        ("ЗАКАЗЧИКИ", ["переговоры", "+ декомпозиция запросов"], ORANGE),
        ("ИССЛЕДОВАНИЕ", ["гипотеза", "+ организация исследования", "+ анализ данных"], PURPLE),
        ("КАЧЕСТВО", ["модерация", "+ контроль", "+ согласование"], GREEN),
        ("УПРАВЛЕНИЕ", ["команда", "+ партнёры", "+ сроки"], BLUE),
    ]
    x0, y0 = 0.95, 2.95
    for i, (t, bl, c) in enumerate(funcs):
        col, row = i % 3, i // 3
        x = x0 + col * 2.25; y = y0 + row * 1.95
        rect(s, x, y, 2.1, 1.8, fill=WHITE, line=BORDER, radius=0.05)
        rect(s, x + 0.14, y + 0.16, 0.3, 0.06, fill=c, radius=0.4)
        add_text(s, x + 0.14, y + 0.3, 1.85, 0.3, [T(t, 8.5, INK, True)])
        add_text(s, x + 0.14, y + 0.62, 1.85, 1.1, [T(l, 7.3, GRAYBLU, False) for l in bl])
    # right column
    rect(s, 7.95, 1.4, 4.65, 2.35, fill=WHITE, line=BORDER, radius=0.04)
    rect(s, 8.15, 1.6, 0.7, 0.7, fill=PURPLE, radius=0.5, shape_type=MSO_SHAPE.OVAL)
    add_text(s, 8.15, 1.6, 0.7, 0.7, [T("МШ", 13, WHITE, True, "c")], anchor="middle")
    add_text(s, 9.0, 1.62, 3.5, 0.35, [T("Шевченко Михаил Алексеевич", 10.5, INK, True)])
    add_text(s, 9.0, 1.95, 3.5, 0.3, [T("Системный администратор · ID 3057513", 7.8, PURPLE, True)])
    add_text(s, 8.15, 2.45, 4.3, 1.2, [T("инфраструктура · домен / хостинг · мониторинг · резервное копирование · тестирование", 7.5, GRAYBLU, False)])
    rect(s, 7.95, 3.9, 4.65, 1.45, fill=CARDBLU, radius=0.04)
    add_text(s, 8.15, 4.02, 4.2, 0.3, [T("Слободенюк Милана", 10.5, INK, True)])
    rect(s, 8.15, 4.36, 2.5, 0.26, fill=WHITE, line=BORDER, radius=0.3)
    add_text(s, 8.15, 4.36, 2.5, 0.26, [T("ПРИВЛЕЧЁННАЯ МЕДИА-ПОДДЕРЖКА", 6.8, GRAYBLU, True, "c")], anchor="middle")
    add_text(s, 8.15, 4.72, 4.3, 0.6, [T("VK-сообщество · тексты · публикации · упаковка результатов", 7.5, GRAYBLU, False)])
    rect(s, 7.95, 5.5, 4.65, 1.45, fill=CARDORG, line=ORANGE, line_w=0.75, radius=0.04)
    add_text(s, 8.15, 5.6, 4.2, 0.26, [T("УПРАВЛЕНЧЕСКИЙ ВЫВОД", 8, ORANGE, True)])
    add_text(s, 8.15, 5.86, 4.2, 0.26, [T("ПЕРВЫЙ МЕЖРЕГИОНАЛЬНЫЙ ВЫХОД · ИВАНОВО", 7.5, INK, True)])
    add_text(s, 8.15, 6.12, 4.2, 0.3, [T("подготовили демо → учреждение выбрало внутреннего специалиста → уточнили модель масштабирования", 6.8, GRAYBLU, False)])
    add_text(s, 8.15, 6.5, 4.2, 0.42, [T("Для работы с государственными учреждениями важны не только качество решения, но и доверительный партнёрский вход.", 7, INK, True)])
    footer(s, "Дорожная карта · письма поддержки · материалы проекта", "07 / 08")

# ---------------------------------------------------------------- SLIDE 8
def slide8(prs):
    s = blank(prs)
    rect(s, 0, 0, SW, SH, fill=DARK, radius=0, shape_type=MSO_SHAPE.RECTANGLE)
    # quote
    picture(s, asset("putin.jpg"), 0.75, 0.45, w=1.15)
    rect(s, 0.75, 0.45, 1.15, 1.31, fill=None, line="2A4763", line_w=0.75, radius=0.03, shape_type=MSO_SHAPE.RECTANGLE)
    add_text(s, 2.15, 0.5, 10.4, 0.9, [
        T("«Действительно, производственный стаж, практика к моменту окончания вуза очень важны. Это очевидно!»", 12.5, WHITE, False, italic=True)])
    add_text(s, 2.15, 1.42, 10.4, 0.3, [T("Владимир Путин · заседание Государственного Совета · 25.12.2025", 8.5, "8FA3BC", False)])
    # headline
    add_text(s, 0.75, 1.95, 11.8, 1.0, [
        T("«СТУДЕНЧЕСКИЙ ПОДРЯД»", 24, WHITE, True, after=2),
        T("МОСТ К ПЕРВОМУ ПРОФЕССИОНАЛЬНОМУ ОПЫТУ", 24, "6EA8FF", True)])
    # chain
    chain = ["ЗАПРОС", "МИКРО-ЗАДАЧА", "РЕАЛЬНЫЙ РЕЗУЛЬТАТ", "ПЕРВЫЙ КЕЙС"]
    cx = 0.75
    for i, c in enumerate(chain):
        w = text_w(c, 9.5, True) + 0.34
        rect(s, cx, 3.0, w, 0.4, fill="0E2440", line="2E5AAC", line_w=0.75, radius=0.3)
        add_text(s, cx, 3.0, w, 0.4, [T(c, 9.5, "9CC0FF" if i < 3 else "7BE0C3", True, "c")], anchor="middle")
        cx += w
        if i < 3:
            add_text(s, cx, 3.0, 0.35, 0.4, [T("→", 10, "6EA8FF", True, "c")], anchor="middle")
            cx += 0.35
    # criteria stairs
    crit = [
        ("1", "СОДЕРЖАТЕЛЬНОСТЬ И ЛОГИКА", ["2 целевые группы →", "1 рабочий цикл"], BLUE),
        ("2", "РЕЗУЛЬТАТИВНОСТЬ", ["64 участника", "· 12 задач", "· 3 из 3 учреждений"], GREEN),
        ("3", "СООТВЕТСТВИЕ ИДЕЕ", ["ядро Дорожной карты", "сохранено", "· проект продолжается"], CYAN),
        ("4", "НОВИЗНА + ОБОСНОВАННОСТЬ", ["микроформат · экосистема", "· кооперация", "· федеральные данные"], PURPLE),
        ("5", "ЛИЧНЫЙ ВКЛАД", ["продукт · разработка", "· заказчики", "· исследование · команда"], ORANGE),
    ]
    x = 0.75
    tops = [4.7, 4.42, 4.14, 3.86, 3.58]
    for i, (n, t, bullets, c) in enumerate(crit):
        y = tops[i]; h = 5.95 - y
        rect(s, x, y, 2.0, h, fill="0E2440", line="23405F", line_w=0.75, radius=0.05)
        rect(s, x + 0.14, y + 0.14, 0.3, 0.3, fill=c, radius=0.5, shape_type=MSO_SHAPE.OVAL)
        add_text(s, x + 0.14, y + 0.14, 0.3, 0.3, [T(n, 9, WHITE, True, "c")], anchor="middle")
        add_text(s, x + 0.12, y + 0.5, 1.78, 0.6, [T(t, 7.3, WHITE, True)])
        add_text(s, x + 0.12, y + 0.98, 1.78, h - 0.98, [T(l, 6.5, "9FB4CC", False) for l in bullets])
        x += 2.1
    # QRs
    qr1 = make_qr("https://xn----gtbba2cfjcjk2l.xn--p1ai/", asset("qr_portal.png"))
    qr2 = make_qr("https://xn----gtbba2cfjcjk2l.xn--p1ai/", asset("qr_proof.png"))
    rect(s, 9.35, 6.1, 1.0, 1.0, fill=WHITE, radius=0.05)
    picture(s, qr1, 9.41, 6.16, w=0.88)
    add_text(s, 9.2, 7.12, 1.3, 0.22, [T("ПОРТАЛ", 6.8, "8FA3BC", True, "c")])
    rect(s, 10.8, 6.1, 1.0, 1.0, fill=WHITE, radius=0.05)
    picture(s, qr2, 10.86, 6.16, w=0.88)
    add_text(s, 10.55, 7.12, 1.5, 0.22, [T("ДОКАЗАТЕЛЬНАЯ БАЗА", 6.8, "8FA3BC", True, "c")])
    # partners
    logos = [("N", "2864E8", "НЕЙМАРК"), ("", "E78A16", "ВШЭ"), ("", "2864E8", "«Высота»"),
             ("ТХ", "7840EE", "команда «Твой Ход»"), ("УК", "526984", "учреждения культуры")]
    lx = 0.75
    for glyph, col, name in logos:
        rect(s, lx, 6.55, 0.24, 0.24, fill=col, radius=0.25)
        if glyph:
            add_text(s, lx, 6.55, 0.24, 0.24, [T(glyph, 6.5, WHITE, True, "c")], anchor="middle")
        elif name == "ВШЭ":
            tri = rect(s, lx + 0.05, 6.6, 0.14, 0.13, fill=WHITE, radius=0, shape_type=MSO_SHAPE.RIGHT_TRIANGLE)
        else:
            tri = rect(s, lx + 0.05, 6.61, 0.14, 0.12, fill=WHITE, radius=0, shape_type=MSO_SHAPE.ISOSCELES_TRIANGLE)
        w = text_w(name, 7, False)
        add_text(s, lx + 0.3, 6.56, w + 0.1, 0.24, [T(name, 7, "8FA3BC", False)])
        lx += 0.3 + w + 0.28
    add_text(s, 0.75, 6.95, 8.5, 0.3, [T("команда проекта: Иван Ершов (лидер) · Михаил Шевченко (системный администратор)", 7, "5E82AC", False)])
    add_text(s, 12.15, 7.1, 0.5, 0.3, [T("08 / 08", 8.5, "8FA3BC", True, "r")])

def build():
    prs = new_prs()
    for fn in (slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8):
        fn(prs)
    out = os.path.join(HERE, "stud_podryad_deck.pptx")
    prs.save(out)
    print("saved", out)

if __name__ == "__main__":
    build()
