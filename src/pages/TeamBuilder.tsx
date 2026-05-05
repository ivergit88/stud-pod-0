import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Heart, Search, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getTaskFormatLabel, getTaskHref } from '../lib/tasks';
import { isResponseLeader } from '../lib/task-responses';

export const TeamBuilder: React.FC = () => {
  const { user } = useAuth();
  const { tasks, responses, studentsDirectory, addTeamMember, removeTeamMember } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedResponseId, setSelectedResponseId] = useState('');
  const [query, setQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [busyStudentId, setBusyStudentId] = useState<string | null>(null);
  const isStudent = user?.role === 'student';
  const currentUserId = user?.id || '';

  const leaderResponses = useMemo(
    () =>
      !isStudent
        ? []
        :
      responses
        .filter(
          (response) =>
            isResponseLeader(response, currentUserId) &&
            (response.status === 'accepted' ||
              response.status === 'pending' ||
              response.status === 'needs_revision'),
        )
        .map((response) => ({
          ...response,
          task: tasks.find((task) => task.id === response.taskId),
        }))
        .filter((response) => response.task),
    [currentUserId, isStudent, responses, tasks],
  );

  useEffect(() => {
    if (leaderResponses.length === 0) {
      setSelectedResponseId('');
      return;
    }

    const responseFromQuery = searchParams.get('response');
    if (responseFromQuery && leaderResponses.some((response) => response.id === responseFromQuery)) {
      setSelectedResponseId(responseFromQuery);
      return;
    }

    setSelectedResponseId((current) => {
      if (current && leaderResponses.some((response) => response.id === current)) {
        return current;
      }

      return leaderResponses[0].id;
    });
  }, [leaderResponses, searchParams]);

  const selectedResponse =
    leaderResponses.find((response) => response.id === selectedResponseId) || leaderResponses[0] || null;
  const selectedTask = selectedResponse?.task || null;

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    studentsDirectory.forEach((student) => {
      (student.skills || []).forEach((skill) => {
        if (skill.trim()) {
          skills.add(skill.trim());
        }
      });
    });

    return Array.from(skills).sort((left, right) => left.localeCompare(right, 'ru'));
  }, [studentsDirectory]);

  const filteredCandidates = useMemo(() => {
    if (!selectedResponse) {
      return [];
    }

    return studentsDirectory
      .filter((student) => {
        if (student.id === currentUserId) {
          return false;
        }

        if (selectedResponse.teamMembers.some((member) => member.studentId === student.id)) {
          return false;
        }

        const haystack = [
          student.name,
          student.university,
          student.description,
          ...(student.skills || []),
        ]
          .join(' ')
          .toLowerCase();

        if (query.trim() && !haystack.includes(query.trim().toLowerCase())) {
          return false;
        }

        if (
          selectedSkills.length > 0 &&
          !selectedSkills.every((skill) => (student.skills || []).includes(skill))
        ) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        const leftSkillMatches = selectedSkills.filter((skill) => left.skills?.includes(skill)).length;
        const rightSkillMatches = selectedSkills.filter((skill) => right.skills?.includes(skill)).length;

        if (leftSkillMatches !== rightSkillMatches) {
          return rightSkillMatches - leftSkillMatches;
        }

        if (left.completedTasksCount !== right.completedTasksCount) {
          return right.completedTasksCount - left.completedTasksCount;
        }

        return right.points - left.points;
      });
  }, [currentUserId, query, selectedResponse, selectedSkills, studentsDirectory]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [query, selectedResponseId, selectedSkills, selectedResponse?.teamMembers.length]);

  const currentCandidate = filteredCandidates[currentIndex] || null;
  const nextCandidate = filteredCandidates[currentIndex + 1] || null;

  const toggleSkill = (skill: string) => {
    setSelectedSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill],
    );
  };

  const handleSelectResponse = (responseId: string) => {
    setSelectedResponseId(responseId);
    setSearchParams({ response: responseId }, { replace: true });
  };

  const handleSkip = () => {
    if (!currentCandidate) {
      return;
    }

    setCurrentIndex((value) => value + 1);
  };

  const handleAdd = async () => {
    if (!selectedResponse || !currentCandidate) {
      return;
    }

    setBusyStudentId(currentCandidate.id);
    try {
      await addTeamMember(selectedResponse.id, currentCandidate.id);
    } catch (error) {
      console.error('Failed to add team member from team builder', error);
      alert('Не удалось добавить участника в команду');
    } finally {
      setBusyStudentId(null);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!selectedResponse) {
      return;
    }

    setBusyStudentId(studentId);
    try {
      await removeTeamMember(selectedResponse.id, studentId);
    } catch (error) {
      console.error('Failed to remove team member from team builder', error);
      alert('Не удалось убрать участника из команды');
    } finally {
      setBusyStudentId(null);
    }
  };

  if (!isStudent || !user) {
    return <div>Доступ запрещен</div>;
  }

  if (leaderResponses.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Подбор сокомандников</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Этот раздел работает для студента-лидера по активной задаче. Сначала возьмите задачу в работу, после этого здесь можно будет искать участников по анкетам и собирать команду.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/задачи"
              className="inline-flex items-center rounded-xl bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 transition-colors"
            >
              Перейти к задачам
            </Link>
            <Link
              to="/студент"
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Вернуться в кабинет
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-builder-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="team-builder-hero mb-8 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="max-w-full break-words text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
              Подбор сокомандников
            </h1>
            <p className="mt-3 max-w-3xl text-gray-600">
              Отдельный раздел для лидера команды: выбираете задачу, фильтруете анкеты по навыкам и по одному добавляете людей в состав. После принятия работы баллы начисляются каждому участнику команды полностью.
            </p>
          </div>
          {selectedTask && (
            <Link
              to={getTaskHref(selectedTask)}
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Открыть полное ТЗ
            </Link>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Users className="h-4 w-4 text-blue-600" />
          Активные задачи лидера
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leaderResponses.map((response) => {
            const isActive = response.id === selectedResponseId;

            return (
              <button
                key={response.id}
                type="button"
                onClick={() => handleSelectResponse(response.id)}
                className={`team-task-button min-w-0 rounded-2xl border px-4 py-4 text-left transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="a11y-category-value break-words text-xs font-medium uppercase tracking-wide text-gray-500">
                  {response.task?.category} • {getTaskFormatLabel(response.task?.format)}
                </div>
                <div className="mt-2 break-words text-base font-semibold text-gray-900">{response.task?.title}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="a11y-task-chip a11y-force-accent rounded-full bg-white px-3 py-1 font-medium text-gray-700">
                    Команда: {response.teamMembers.length}
                  </span>
                  <span className="a11y-task-points a11y-force-accent rounded-full bg-white px-3 py-1 font-medium text-gray-700">
                    {response.task?.pointsReward} баллов каждому
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Search className="h-4 w-4 text-blue-600" />
          Фильтры подбора
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <div>
            <label className="block text-sm font-medium text-gray-700">Поиск по анкетам</label>
            <div className="mt-2 flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Имя, вуз, описание, навык..."
                className="ml-3 w-full border-0 bg-transparent p-0 text-gray-900 outline-none"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {selectedTask && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                Для текущей задачи можно быстро отбирать людей по навыкам и смотреть готовность профиля: выполненные задачи, баллы, описание и специализацию.
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {allSkills.slice(0, 18).map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedSkills.includes(skill)
                  ? 'bg-blue-700 text-white'
                  : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {skill}
            </button>
          ))}
          {selectedSkills.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSkills([])}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Сбросить навыки
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="team-candidate-section rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Карточка кандидата</h2>
              <p className="mt-1 text-sm text-gray-600">
                Карточный просмотр: смотрите одну анкету, пропускайте или сразу добавляйте в выбранную команду.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {currentCandidate ? `${currentIndex + 1} из ${filteredCandidates.length}` : 'Нет кандидатов'}
            </div>
          </div>

          {currentCandidate ? (
            <div className="team-candidate-stage relative">
              {nextCandidate && (
                <div className="team-candidate-backdrop absolute inset-x-6 top-4 h-full rounded-[28px] border border-gray-200 bg-gray-100/80" />
              )}
              <div className="team-candidate-card relative min-w-0 rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-blue-50 to-slate-100 p-5 shadow-sm sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="break-words text-sm font-medium text-blue-700">
                      {selectedTask?.title}
                    </div>
                    <h3 className="team-candidate-name mt-2 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                      {currentCandidate.name}
                    </h3>
                    <div className="team-candidate-meta mt-3 flex flex-wrap gap-2 text-sm">
                      <span className="team-profile-chip break-words rounded-full bg-white px-3 py-1 font-medium text-gray-700">
                        {currentCandidate.university || 'Вуз не указан'}
                      </span>
                      {currentCandidate.course && (
                        <span className="team-profile-chip rounded-full bg-white px-3 py-1 font-medium text-gray-700">
                          {currentCandidate.course} курс
                        </span>
                      )}
                      <span className="team-profile-chip rounded-full bg-white px-3 py-1 font-medium text-gray-700">
                        Выполнено: {currentCandidate.completedTasksCount}
                      </span>
                      <span className="team-profile-chip rounded-full bg-white px-3 py-1 font-medium text-gray-700">
                        Баллы: {currentCandidate.points}
                      </span>
                    </div>
                  </div>
                  <div className="a11y-force-surface rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900">
                    После подтверждения задачи этот участник получит полные {selectedTask?.pointsReward} баллов, как и лидер.
                  </div>
                </div>

                <div className="a11y-force-surface mt-6 rounded-2xl border border-white/70 bg-white/80 p-5">
                  <div className="text-sm font-semibold text-gray-900">О себе</div>
                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {currentCandidate.description || 'Описание профиля пока не заполнено.'}
                  </p>
                </div>

                <div className="mt-5">
                  <div className="text-sm font-semibold text-gray-900">Навыки</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(currentCandidate.skills || []).length > 0 ? (
                      currentCandidate.skills!.map((skill) => (
                        <span
                          key={skill}
                          className={`team-profile-chip rounded-full px-3 py-1.5 text-sm font-medium ${
                            selectedSkills.includes(skill)
                              ? 'bg-blue-700 text-white'
                              : 'bg-white text-blue-700 border border-blue-100'
                          }`}
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Навыки не указаны</span>
                    )}
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <X className="mr-2 h-5 w-5" />
                    Пропустить
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAdd()}
                    disabled={busyStudentId === currentCandidate.id}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-5 py-4 text-base font-medium text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    {busyStudentId === currentCandidate.id ? 'Добавляем...' : 'В команду'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Кандидаты закончились</h3>
              <p className="mt-2 text-sm text-gray-600">
                По текущим фильтрам подходящих анкет больше нет. Измените запрос или выберите другую задачу лидера.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="team-side-card rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Текущая команда</h2>
            <p className="mt-1 text-sm text-gray-600">
              Состав привязан к выбранной задаче. Здесь же можно убрать участника, если состав изменился.
            </p>
            <div className="mt-5 space-y-3">
              {selectedResponse?.teamMembers.map((member) => (
                <div key={member.studentId} className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words font-semibold text-gray-900">{member.studentName}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {member.role === 'leader' ? 'Лидер команды' : 'Участник команды'}
                      </div>
                    </div>
                    {member.role !== 'leader' && (
                      <button
                        type="button"
                        onClick={() => void handleRemove(member.studentId)}
                        disabled={busyStudentId === member.studentId}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {busyStudentId === member.studentId ? 'Убираем...' : 'Убрать'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {selectedTask && (
            <section className="team-side-card rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Параметры задачи</h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div className="a11y-force-surface rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Категория</div>
                  <div className="a11y-category-value mt-1 font-semibold text-gray-900">{selectedTask.category}</div>
                </div>
                <div className="a11y-force-surface rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Формат</div>
                  <div className="mt-1 font-semibold text-gray-900">{getTaskFormatLabel(selectedTask.format)}</div>
                </div>
                <div className="a11y-force-surface rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Дедлайн</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {new Date(selectedTask.deadline).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};
