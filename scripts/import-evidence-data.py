#!/usr/bin/env python3
import argparse
import bcrypt
import hashlib
import json
import re
import secrets
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook


DEFAULT_SOURCE = Path('/mnt/c/Users/Administrator/Downloads/Доказательная_база_Студенческий_подряд_2026_ГОТОВО/Доказательная_база_Студенческий_подряд_2026/02_RAW_НЕ_ИЗМЕНЯТЬ/02_КОНСОЛИДИРОВАННЫЕ_30-08')
ORGANIZATIONS = {
    'ЦБС г. Кстово': ('cbs-kstovo@mail.ru', 'Орлова Ирина Викторовна'),
    'Музей истории г. Арзамас': ('muzej-arzamas@mail.ru', 'Беляев Константин Романович'),
    'Шарангский районный ДК': ('sharanga-dk@mail.ru', 'Громова Светлана Олеговна'),
    'Нижегородский областной центр народного творчества': ('ocnt-nnov@yandex.ru', 'Тихомирова Марина Сергеевна'),
    'Центральная библиотека г. Дзержинска': ('cbs-dzer@mail.ru', 'Авдеев Пётр Сергеевич'),
}
EVENTS = [
    (
        'EVENT-01',
        'Первая очная проектная сессия',
        '2026-05-03T12:00:00',
        'МЦ «Высота», Нижний Новгород',
        '01_Регистрация*',
        'Участники разобрали работу сервиса и пользовательский путь, зарегистрировались на платформе и познакомились с пилотными задачами учреждений Кстово и Шаранги.',
    ),
    (
        'EVENT-02',
        'Вторая очная проектная сессия',
        '2026-07-14T12:00:00',
        'МЦ «Высота», Нижний Новгород',
        '02_Регистрация*',
        'Практическая работа с цифровым архивом ЦБС г. Кстово: эскиз и архитектура страницы, код-ревью с наставничеством и адаптивная вёрстка HTML/CSS.',
    ),
    (
        'EVENT-03',
        'Третья очная проектная сессия',
        '2026-08-04T12:00:00',
        'МЦ «Высота», Нижний Новгород',
        '03_Регистрация*',
        'Итоговая сессия пилота: разбор выполненных задач, обратная связь по результатам, оформление первых кейсов и выбор задач следующей волны.',
    ),
]
SURVEYS = [
    ('input-participants', 'Входной опрос участников', '04_Входной_опрос*'),
    ('output-participants', 'Выходной опрос участников', '05_Выходной_опрос*'),
]


def stable_id(prefix: str, value: str) -> str:
    return f'{prefix}-{hashlib.sha256(value.encode("utf-8")).hexdigest()[:20]}'


def iso(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value or '')


def split_name(full_name: str):
    parts = str(full_name).strip().split()
    return (parts[1] if len(parts) > 1 else '', parts[0] if parts else '', ' '.join(parts[2:]))


def generated_email(account_id: str):
    return f'{account_id.lower()}@participants.stud-pod.local'


def bcrypt_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def task_type(category: str):
    text = category.lower()
    if 'видео' in text:
        return 'video'
    if 'дизайн' in text or 'ux' in text:
        return 'design'
    if 'копирайт' in text or 'smm' in text:
        return 'content'
    return 'website'


def read_rows(path: Path):
    worksheet = load_workbook(path, read_only=True, data_only=True).active
    rows = list(worksheet.iter_rows(values_only=True))
    return [dict(zip(rows[0], row)) for row in rows[1:] if any(value is not None for value in row)]


def survey_questions(path: Path):
    worksheet = load_workbook(path, read_only=True, data_only=True).active
    headers = [str(value or '').strip() for value in next(worksheet.iter_rows(values_only=True))]
    ignored = {'ID', 'Время начала заполнения формы', 'Время создания', 'Время затраченное на заполнение формы'}
    return [{'id': f'q{index}', 'label': header, 'type': 'text'} for index, header in enumerate(headers, 1) if header and header not in ignored]


def main():
    parser = argparse.ArgumentParser(description='Идемпотентный импорт доказательной базы в SQLite.')
    parser.add_argument('--database', required=True)
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--clear-demo', action='store_true')
    parser.add_argument('--credentials-file', default='')
    args = parser.parse_args()

    source = Path(args.source)
    registration = read_rows(next(source.glob('00_Регистрация*')))
    task_rows = read_rows(next(source.glob('06_Карточки*')))
    event_registration_rows = {
        code: read_rows(next(source.glob(pattern))) for code, _, _, _, pattern, _ in EVENTS
    }

    students = []
    for row in registration:
        account_id = str(row.get('ID аккаунта на портале') or f'SP-{row["ID"]}')
        last_name, first_name, middle_name = split_name(row['ФИО'])
        students.append({
            'id': account_id,
            'email': generated_email(account_id),
            'name': row['ФИО'],
            'firstName': first_name,
            'lastName': last_name,
            'middleName': middle_name,
            'university': row.get('Образовательная организация') or '',
            'course': int(row.get('Курс') or 1),
            'description': f"{row.get('Направление подготовки') or ''}. Город: {row.get('Город') or 'не указан'}. Формат: {row.get('Какой формат участия интересен?') or 'не указан'}.",
            'skills': [row.get('Направление подготовки') or 'Начинающий специалист'],
            'createdAt': iso(row.get('Время создания')),
        })

    if not any(student['name'].lower() == 'александр белов' for student in students):
        students.append({
            'id': 'SP-ALEXANDER-BELOV',
            'email': 'alexander.belov@participants.stud-pod.local',
            'name': 'Александр Белов',
            'firstName': 'Александр',
            'lastName': 'Белов',
            'middleName': '',
            'university': 'Университет Неймарк',
            'course': 3,
            'description': 'Самый активный участник пилота. Добавлен по уточнению руководителя проекта.',
            'skills': ['Веб-разработка', 'Дизайн', 'Контент'],
            'createdAt': '2026-04-01T00:00:00',
        })

    print(json.dumps({
        'students': len(students),
        'sourceStudents': len(registration),
        'organizations': len(ORGANIZATIONS),
        'tasks': len(task_rows),
        'events': len(EVENTS),
        'eventRegistrations': sum(len(rows) for rows in event_registration_rows.values()),
        'mode': 'apply' if args.apply else 'dry-run',
    }, ensure_ascii=False, indent=2))
    if not args.apply:
        return

    credentials_path = Path(args.credentials_file) if args.credentials_file else Path(args.database).with_name('imported-user-credentials.csv')
    credentials = []

    database = Path(args.database)
    database.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    cursor = connection.cursor()
    cursor.execute('PRAGMA foreign_keys = ON')

    try:
        cursor.execute('BEGIN IMMEDIATE')
        if args.clear_demo:
            demo_ids = [row[0] for row in cursor.execute("SELECT id FROM users WHERE id LIKE 'demo-student-%'")]
            for demo_id in demo_ids:
                cursor.execute('DELETE FROM notifications WHERE userId = ?', (demo_id,))
                cursor.execute('DELETE FROM purchases WHERE studentId = ?', (demo_id,))
                cursor.execute('DELETE FROM event_registrations WHERE studentId = ?', (demo_id,))
                cursor.execute('DELETE FROM task_response_members WHERE studentId = ?', (demo_id,))
                cursor.execute('DELETE FROM task_responses WHERE studentId = ?', (demo_id,))
                cursor.execute('DELETE FROM users WHERE id = ?', (demo_id,))
            cursor.execute("DELETE FROM purchases WHERE productId = 'partner-merch-hoodie-2026'")
            cursor.execute("DELETE FROM products WHERE id = 'partner-merch-hoodie-2026'")

        for student in students:
            points = 1000 if student['id'] == 'SP-ALEXANDER-BELOV' else 0
            existing = cursor.execute('SELECT password_hash FROM users WHERE id = ?', (student['id'],)).fetchone()
            needs_credentials = not existing or str(existing['password_hash']).startswith('IMPORT_DISABLED:')
            password = secrets.token_urlsafe(12) if needs_credentials else ''
            password_hash = bcrypt_hash(password) if needs_credentials else existing['password_hash']
            if needs_credentials:
                credentials.append((student['name'], student['email'], password))
            cursor.execute('''
                INSERT INTO users (id, email, password_hash, role, name, points, university, course, skills,
                    firstName, lastName, middleName, description, status, created_at)
                VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
                ON CONFLICT(id) DO UPDATE SET name=excluded.name, university=excluded.university,
                    course=excluded.course, skills=excluded.skills, firstName=excluded.firstName,
                    lastName=excluded.lastName, middleName=excluded.middleName, description=excluded.description,
                    password_hash=excluded.password_hash, status='active'
            ''', (student['id'], student['email'], password_hash, student['name'], points,
                  student['university'], student['course'], json.dumps(student['skills'], ensure_ascii=False),
                  student['firstName'], student['lastName'], student['middleName'], student['description'], student['createdAt']))

        for index, (name, (email, contact)) in enumerate(ORGANIZATIONS.items(), 1):
            org_id = f'evidence-org-{index:02d}'
            existing = cursor.execute('SELECT password_hash FROM users WHERE id = ?', (org_id,)).fetchone()
            needs_credentials = not existing or str(existing['password_hash']).startswith('IMPORT_DISABLED:')
            password = secrets.token_urlsafe(12) if needs_credentials else ''
            password_hash = bcrypt_hash(password) if needs_credentials else existing['password_hash']
            if needs_credentials:
                credentials.append((name, email, password))
            cursor.execute('''
                INSERT INTO users (id, email, password_hash, role, name, points, contactPerson, status, created_at)
                VALUES (?, ?, ?, 'organization', ?, 0, ?, 'active', '2026-04-01T00:00:00')
                ON CONFLICT(id) DO UPDATE SET email=excluded.email, name=excluded.name,
                    password_hash=excluded.password_hash, contactPerson=excluded.contactPerson,
                    role='organization', status='active'
            ''', (org_id, email, password_hash, name, contact))

        students_by_name = {student['name'].lower(): student for student in students}
        org_ids = {name: f'evidence-org-{index:02d}' for index, name in enumerate(ORGANIZATIONS, 1)}
        task_points = {}
        # По решению руководителя проекта все 12 задач пилота считаются принятыми заказчиком.
        earned_by_student = {}
        for index, row in enumerate(task_rows, 1):
            task_id = row['Код задачи']
            organization_id = org_ids[row['Учреждение культуры']]
            status = 'completed'
            points = 80 + index * 5
            task_points[task_id] = points
            cursor.execute('''
                INSERT INTO tasks (id, title, description, requirements, organizationId, organizationName,
                    category, format, workload, taskType, urgency, requiresOrgMaterials, requiresOnsiteCheck,
                    slug, pointsReward, pointsMin, pointsRecommended, pointsMax, pointsExplanation, taskKind,
                    childOrder, deadline, status, materialsLink, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'online', 'one_day', ?, 'normal', 1, 0, ?, ?, ?, ?, ?, ?, 'single', 0, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description,
                    requirements=excluded.requirements, organizationId=excluded.organizationId,
                    organizationName=excluded.organizationName, category=excluded.category,
                    taskType=excluded.taskType, pointsReward=excluded.pointsReward, pointsMin=excluded.pointsMin,
                    pointsRecommended=excluded.pointsRecommended, pointsMax=excluded.pointsMax,
                    deadline=excluded.deadline, status=excluded.status, materialsLink=excluded.materialsLink
            ''', (task_id, row['Название задачи'], row['Исходный запрос'], row['Ожидаемый результат'], organization_id,
                  row['Учреждение культуры'], row['Категория'], task_type(row['Категория']), task_id.lower(), points,
                  points, points, points, json.dumps(['Импортировано из реестра доказательной базы'], ensure_ascii=False),
                  iso(row['Дедлайн']), status, row.get('Ссылка на результат') or '', iso(row['Время создания'])))

            participant_names = [name.strip() for name in str(row.get('ФИО участников') or '').split(';') if name.strip()]
            if not participant_names:
                continue
            leader = students_by_name.get(participant_names[0].lower())
            if not leader:
                continue
            response_id = stable_id('evidence-response', task_id)
            response_status = 'completed' if status == 'completed' else 'accepted'
            cursor.execute('''
                INSERT INTO task_responses (id, taskId, studentId, studentName, status, submissionLink,
                    reviewComment, created_at, updated_at, appealCount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                ON CONFLICT(id) DO UPDATE SET studentId=excluded.studentId, studentName=excluded.studentName,
                    status=excluded.status, submissionLink=excluded.submissionLink, reviewComment=excluded.reviewComment
            ''', (response_id, task_id, leader['id'], leader['name'], response_status,
                  row.get('Ссылка на результат') or '', row.get('Подтверждение учреждения') or '',
                  iso(row.get('Дата передачи') or row['Время создания']), iso(row.get('Дата приёмки') or row['Время создания'])))
            for member_index, participant_name in enumerate(participant_names):
                student = students_by_name.get(participant_name.lower())
                if not student:
                    continue
                cursor.execute('''
                    INSERT OR IGNORE INTO task_response_members
                    (id, responseId, taskId, studentId, studentName, role, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (stable_id('evidence-member', f'{task_id}:{student["id"]}'), response_id, task_id,
                      student['id'], student['name'], 'leader' if member_index == 0 else 'member', iso(row['Время создания'])))
                if status == 'completed':
                    earned_by_student[student['id']] = earned_by_student.get(student['id'], 0) + points

        # Баллы пересчитываются абсолютно (идемпотентно): каждый участник получает
        # сумму наград за все выполненные задачи пилота, а не максимум из них.
        for student_id, earned in earned_by_student.items():
            cursor.execute('UPDATE users SET points = ? WHERE id = ?', (earned, student_id))

        alexander = next(student for student in students if student['id'] == 'SP-ALEXANDER-BELOV')
        cursor.execute('UPDATE users SET points = ? WHERE id = ?', (max(sum(task_points.values()), 1000), alexander['id']))

        default_org_id = org_ids['ЦБС г. Кстово']
        for event_code, title, date, location, _, description in EVENTS:
            rows = event_registration_rows[event_code]
            cursor.execute('''
                INSERT INTO events (id, title, description, organizationId, organizationName, date, location,
                    pointsReward, imageUrl, surveyUrl, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 20, '', ?, '2026-04-01T00:00:00')
                ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description,
                    date=excluded.date, location=excluded.location, surveyUrl=excluded.surveyUrl
            ''', (event_code, title,
                  f'{description} По реестру зарегистрировано участников: {len(rows)}.',
                  default_org_id, 'ЦБС г. Кстово', date, location, f'/опросы/{event_code.lower()}'))
            for row in rows:
                student = students_by_name.get(str(row['ФИО']).lower())
                if not student:
                    continue
                cursor.execute('''
                    INSERT OR IGNORE INTO event_registrations (id, eventId, studentId, created_at)
                    VALUES (?, ?, ?, ?)
                ''', (stable_id('evidence-event-registration', f'{event_code}:{student["id"]}'), event_code,
                      student['id'], iso(row['Время создания'])))

        for survey_id, title, pattern in SURVEYS:
            path = next(source.glob(pattern))
            cursor.execute('''
                INSERT INTO surveys (id, title, description, questions, sourceFile, published, created_at)
                VALUES (?, ?, ?, ?, ?, 1, '2026-04-01T00:00:00')
                ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description,
                    questions=excluded.questions, sourceFile=excluded.sourceFile, published=1
            ''', (survey_id, title, 'Форма восстановлена по структуре исходной XLSX-выгрузки.',
                  json.dumps(survey_questions(path), ensure_ascii=False), path.name))

        event_question = [
            {'id': 'name', 'label': 'ФИО', 'type': 'text'},
            {'id': 'organization', 'label': 'Образовательная организация', 'type': 'text'},
            {'id': 'course', 'label': 'Курс', 'type': 'text'},
            {'id': 'telegram', 'label': 'Укажите Ваш Telegram', 'type': 'text'},
            {'id': 'expectations', 'label': 'Что хотите получить от встречи?', 'type': 'text'},
        ]
        for event_code, title, _, _, pattern, _ in EVENTS:
            source_file = next(source.glob(pattern)).name
            cursor.execute('''
                INSERT INTO surveys (id, title, description, questions, sourceFile, published, created_at)
                VALUES (?, ?, ?, ?, ?, 1, '2026-04-01T00:00:00')
                ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description,
                    questions=excluded.questions, sourceFile=excluded.sourceFile, published=1
            ''', (event_code.lower(), f'Регистрация: {title}', 'Регистрация на очную проектную сессию.',
                  json.dumps(event_question, ensure_ascii=False), source_file))

        merch_id = 'neimark-merch-winner-2026'
        merch_price = 1200
        alexander_id = 'SP-ALEXANDER-BELOV'
        cursor.execute('''
            INSERT INTO products (id, title, description, price, category, imageUrl, stock, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, '2026-08-05T18:00:00')
            ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description,
                price=excluded.price, category=excluded.category, imageUrl=excluded.imageUrl, stock=0
        ''', (
            merch_id,
            'Комплект мерча Университета Неймарк',
            'Приз для самого активного участника пилота: худи и футболка Университета Неймарк.',
            merch_price,
            'Итоговая награда пилота',
            '/rewards/neimark-merch-2026.webp',
        ))
        purchase_id = 'evidence-purchase-alexander-belov-2026'
        cursor.execute('''
            INSERT INTO purchases (id, productId, studentId, price, status, created_at)
            VALUES (?, ?, ?, ?, 'fulfilled', '2026-08-05T18:00:00')
            ON CONFLICT(id) DO UPDATE SET productId=excluded.productId, studentId=excluded.studentId,
                price=excluded.price, status='fulfilled'
        ''', (purchase_id, merch_id, alexander_id, merch_price))
        cursor.execute(
            'UPDATE users SET points = MAX(0, ? - ?) WHERE id = ?',
            (max(sum(task_points.values()), 1000), merch_price, alexander_id),
        )
        cursor.execute('''
            INSERT INTO notifications (id, userId, title, message, read, type, link, created_at)
            VALUES (?, ?, ?, ?, 0, 'success', '/магазин', '2026-08-05T18:00:00')
            ON CONFLICT(id) DO UPDATE SET title=excluded.title, message=excluded.message, link=excluded.link
        ''', (
            'evidence-notification-alexander-merch',
            alexander_id,
            'Итоговая награда получена',
            'Вы обменяли 1200 баллов на комплект мерча Университета Неймарк. Награда выдана.',
        ))

        connection.commit()
        if credentials:
            credentials_path.parent.mkdir(parents=True, exist_ok=True)
            with credentials_path.open('w', encoding='utf-8-sig', newline='') as output:
                output.write('ФИО;Email;Временный пароль\n')
                for name, email, password in credentials:
                    output.write(f'{name};{email};{password}\n')
            try:
                credentials_path.chmod(0o600)
            except OSError:
                pass
            print(f'Учётные данные записаны в закрытый файл: {credentials_path}')
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == '__main__':
    main()
