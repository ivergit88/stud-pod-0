import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { buildExpertDemoState } from '../lib/expert-demo';
import { useAuth } from './AuthContext';
import type { TaskFormat } from '../lib/tasks';
import type { TaskType, TaskUrgency, TaskWorkload } from '../lib/task-scoring';
import type { GeneratedProjectSubtask } from '../lib/task-projects';

export interface Task {
  id: string;
  slug?: string;
  title: string;
  description: string;
  requirements?: string;
  organizationId: string;
  organizationName: string;
  organizationAddress?: string;
  category: string;
  format: TaskFormat;
  workload: TaskWorkload;
  taskType: TaskType;
  urgency: TaskUrgency;
  requiresOrgMaterials: boolean;
  requiresOnsiteCheck: boolean;
  pointsReward: number;
  pointsMin: number;
  pointsRecommended: number;
  pointsMax: number;
  pointsExplanation: string[];
  taskKind: 'single' | 'parent' | 'subtask';
  parentTaskId?: string;
  parentTaskTitle?: string;
  parentTaskSlug?: string;
  childOrder: number;
  subtaskCount: number;
  completedSubtaskCount: number;
  siblingCount: number;
  deadline: string;
  status: 'open' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  createdAt: string;
  executorId?: string;
  location?: string;
  coordinates?: [number, number];
  attachments?: TaskAttachment[];
  materialsLink?: string;
}

export interface TaskAttachment {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface ExistingTaskAttachmentPayload {
  kind: 'existing';
  id: string;
}

export interface NewTaskAttachmentPayload {
  kind: 'new';
  originalName: string;
  mimeType: string;
  size: number;
  contentBase64: string;
}

export type TaskAttachmentPayload = ExistingTaskAttachmentPayload | NewTaskAttachmentPayload;

export interface TaskDraft {
  title: string;
  description: string;
  requirements?: string;
  organizationId: string;
  organizationName: string;
  category: string;
  format: TaskFormat;
  workload: TaskWorkload;
  taskType: TaskType;
  urgency: TaskUrgency;
  requiresOrgMaterials: boolean;
  requiresOnsiteCheck: boolean;
  pointsReward: number;
  deadline: string;
  executorId?: string;
  location?: string;
  coordinates?: [number, number];
  attachments?: TaskAttachmentPayload[];
  materialsLink?: string;
}

export interface TaskUpdatePayload {
  title: string;
  description: string;
  requirements?: string;
  category: string;
  format: TaskFormat;
  workload: TaskWorkload;
  taskType: TaskType;
  urgency: TaskUrgency;
  requiresOrgMaterials: boolean;
  requiresOnsiteCheck: boolean;
  pointsReward: number;
  deadline: string;
  location?: string;
  coordinates?: [number, number];
  attachments?: TaskAttachmentPayload[];
  materialsLink?: string;
}

export interface TaskProjectDraft {
  title: string;
  projectBrief: string;
  projectSummary?: string;
  projectRequirements?: string;
  format: TaskFormat;
  deadline: string;
  location?: string;
  coordinates?: [number, number];
  attachments?: TaskAttachmentPayload[];
  materialsLink?: string;
  subtasks: GeneratedProjectSubtask[];
}

export interface TaskResponseTeamMember {
  id: string;
  responseId: string;
  taskId: string;
  studentId: string;
  studentName: string;
  role: 'leader' | 'member';
  university?: string;
  course?: number;
  description?: string;
  skills?: string[];
  createdAt: string;
}

export interface TaskResponse {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'submitted' | 'completed' | 'needs_revision';
  coverLetter?: string;
  submissionLink?: string;
  reviewComment?: string;
  appealReason?: string;
  appealedAt?: string;
  appealCount: number;
  createdAt: string;
  updatedAt: string;
  teamMembers: TaskResponseTeamMember[];
}

export interface StudentDirectoryProfile {
  id: string;
  name: string;
  university?: string;
  course?: number;
  description?: string;
  skills?: string[];
  points: number;
  completedTasksCount: number;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  organizationName: string;
  date: string;
  location: string;
  coordinates?: [number, number];
  pointsReward: number;
  registrationsCount: number;
  imageUrl?: string;
  surveyUrl?: string;
  createdAt: string;
}

export interface EventDraft {
  title: string;
  description: string;
  organizationId: string;
  organizationName: string;
  date: string;
  location: string;
  coordinates?: [number, number];
  pointsReward: number;
  imageUrl?: string;
}

export interface EventUpdatePayload {
  title: string;
  description: string;
  date: string;
  location: string;
  coordinates?: [number, number];
  pointsReward: number;
  imageUrl?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  studentId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock: number;
  createdAt: string;
}

export interface Purchase {
  id: string;
  productId: string;
  studentId: string;
  price: number;
  status: 'pending' | 'fulfilled';
  createdAt: string;
}

export interface RewardWinner {
  productId: string;
  productTitle: string;
  productImageUrl: string;
  studentName: string;
  price: number;
  awardedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  type?: 'info' | 'success' | 'warning';
}

export interface PlatformStats {
  totalStudents: number;
  totalOrganizations: number;
  activeTasks: number;
  completedTasks: number;
  totalResponses: number;
  totalPointsAwarded: number;
}

export interface EvidenceStats {
  registeredParticipants: number;
  participatingOrganizations: number;
  publishedTasks: number;
  completedTasks: number;
  offlineEvents: number;
}

export interface BootstrapPayload {
  tasks: Task[];
  responses: TaskResponse[];
  events: Event[];
  eventRegistrations: EventRegistration[];
  products: Product[];
  purchases: Purchase[];
  notifications: Notification[];
  studentsDirectory: StudentDirectoryProfile[];
  platformStats: PlatformStats;
  evidenceStats: EvidenceStats;
  rewardWinners: RewardWinner[];
}

interface DataContextType extends BootstrapPayload {
  loading: boolean;
  addTask: (task: TaskDraft) => Promise<void>;
  publishTaskProject: (task: TaskProjectDraft) => Promise<void>;
  updateTask: (taskId: string, task: TaskUpdatePayload) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addEvent: (event: EventDraft) => Promise<void>;
  updateEvent: (eventId: string, event: EventUpdatePayload) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  takeTask: (taskId: string, studentId: string, studentName: string, coverLetter?: string) => Promise<void>;
  addTeamMember: (responseId: string, studentId: string) => Promise<void>;
  removeTeamMember: (responseId: string, studentId: string) => Promise<void>;
  submitTask: (responseId: string, submissionLink: string) => Promise<void>;
  reviewTask: (responseId: string, status: 'completed' | 'needs_revision', comment: string) => Promise<void>;
  appealCompletedTask: (responseId: string, reason: string) => Promise<void>;
  registerForEvent: (eventId: string) => Promise<void>;
  buyProduct: (productId: string, price: number) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const EXPERT_DATA_KEY = 'stud-pod-expert-data-v1';

const EMPTY_STATE: BootstrapPayload = {
  tasks: [],
  responses: [],
  events: [],
  eventRegistrations: [],
  products: [],
  purchases: [],
  notifications: [],
  studentsDirectory: [],
  platformStats: {
    totalStudents: 0,
    totalOrganizations: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalResponses: 0,
    totalPointsAwarded: 0,
  },
  evidenceStats: {
    registeredParticipants: 64,
    participatingOrganizations: 5,
    publishedTasks: 12,
    completedTasks: 12,
    offlineEvents: 3,
  },
  rewardWinners: [],
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, isExpertMode } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [responses, setResponses] = useState<TaskResponse[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentsDirectory, setStudentsDirectory] = useState<StudentDirectoryProfile[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>(EMPTY_STATE.platformStats);
  const [evidenceStats, setEvidenceStats] = useState<EvidenceStats>(EMPTY_STATE.evidenceStats);
  const [rewardWinners, setRewardWinners] = useState<RewardWinner[]>([]);
  const [loading, setLoading] = useState(true);

  const applyState = (data: BootstrapPayload) => {
    setTasks(data.tasks);
    setResponses(data.responses);
    setEvents(data.events);
    setEventRegistrations(data.eventRegistrations);
    setProducts(data.products);
    setPurchases(data.purchases);
    setNotifications(data.notifications);
    setStudentsDirectory(data.studentsDirectory);
    setPlatformStats(data.platformStats);
    setEvidenceStats(data.evidenceStats || EMPTY_STATE.evidenceStats);
    setRewardWinners(data.rewardWinners || []);
  };

  const readExpertState = (): BootstrapPayload => {
    try {
      const saved = window.localStorage.getItem(EXPERT_DATA_KEY);
      if (!saved) {
        return buildExpertDemoState();
      }
      const parsed = JSON.parse(saved);
      return {
        ...EMPTY_STATE,
        ...parsed,
        platformStats: { ...EMPTY_STATE.platformStats, ...(parsed.platformStats || {}) },
        evidenceStats: { ...EMPTY_STATE.evidenceStats, ...(parsed.evidenceStats || {}) },
        rewardWinners: parsed.rewardWinners || [],
      };
    } catch {
      return buildExpertDemoState();
    }
  };

  const writeExpertState = (next: BootstrapPayload) => {
    window.localStorage.setItem(EXPERT_DATA_KEY, JSON.stringify(next));
    applyState(next);
  };

  const getCurrentState = (): BootstrapPayload => ({
    tasks,
    responses,
    events,
    eventRegistrations,
    products,
    purchases,
    notifications,
    studentsDirectory,
    platformStats,
    evidenceStats,
    rewardWinners,
  });

  const loadData = async () => {
    if (isExpertMode) {
      applyState(readExpertState());
      return;
    }
    const data = await apiRequest<BootstrapPayload>('/api/bootstrap');
    applyState(data);
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let mounted = true;

    const syncData = async () => {
      setLoading(true);

      try {
        const data = isExpertMode
          ? readExpertState()
          : await apiRequest<BootstrapPayload>('/api/bootstrap');
        if (mounted) {
          applyState(data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        if (mounted) {
          applyState(EMPTY_STATE);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void syncData();

    return () => {
      mounted = false;
    };
  }, [authLoading, isExpertMode, user?.id]);

  const runMutation = async (action: () => Promise<unknown>) => {
    await action();
    await loadData();
  };

  const addTask = async (taskData: TaskDraft) => {
    if (isExpertMode) {
      const now = new Date().toISOString();
      const task: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        slug: crypto.randomUUID(),
        format: taskData.format,
        workload: taskData.workload,
        taskType: taskData.taskType,
        urgency: taskData.urgency,
        requiresOrgMaterials: taskData.requiresOrgMaterials,
        requiresOnsiteCheck: taskData.requiresOnsiteCheck,
        pointsMin: Math.max(10, taskData.pointsReward - 10),
        pointsRecommended: taskData.pointsReward,
        pointsMax: taskData.pointsReward + 20,
        pointsExplanation: ['Тестовый расчёт баллов'],
        taskKind: 'single',
        childOrder: 0,
        subtaskCount: 0,
        completedSubtaskCount: 0,
        siblingCount: 0,
        status: 'open',
        createdAt: now,
        attachments: [],
      };
      const state = getCurrentState();
      writeExpertState({ ...state, tasks: [task, ...state.tasks] });
      return;
    }
    await runMutation(() =>
      apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),
    );
  };

  const publishTaskProject = async (taskData: TaskProjectDraft) => {
    if (isExpertMode) {
      const now = new Date().toISOString();
      const parentId = crypto.randomUUID();
      const subtasks: Task[] = taskData.subtasks.map((subtask, index) => ({
        id: crypto.randomUUID(),
        slug: crypto.randomUUID(),
        title: subtask.title,
        description: subtask.description,
        requirements: subtask.requirements,
        organizationId: 'expert-organization',
        organizationName: 'Тестовое учреждение культуры',
        category: subtask.taskType,
        format: taskData.format,
        workload: subtask.workload,
        taskType: subtask.taskType,
        urgency: subtask.urgency,
        requiresOrgMaterials: subtask.requiresOrgMaterials,
        requiresOnsiteCheck: false,
        pointsReward: subtask.pointsReward || 40,
        pointsMin: subtask.pointsReward || 40,
        pointsRecommended: subtask.pointsReward || 40,
        pointsMax: subtask.pointsReward || 40,
        pointsExplanation: ['Тестовый расчёт баллов'],
        taskKind: 'subtask',
        parentTaskId: parentId,
        parentTaskTitle: taskData.title,
        childOrder: index + 1,
        subtaskCount: 0,
        completedSubtaskCount: 0,
        siblingCount: taskData.subtasks.length,
        deadline: subtask.deadline,
        status: 'open',
        createdAt: now,
        location: taskData.location,
        coordinates: taskData.coordinates,
        attachments: [],
        materialsLink: taskData.materialsLink,
      }));
      const totalPoints = subtasks.reduce((sum, task) => sum + task.pointsReward, 0);
      const parent: Task = {
        ...subtasks[0],
        id: parentId,
        slug: crypto.randomUUID(),
        title: taskData.title,
        description: taskData.projectSummary || taskData.projectBrief,
        requirements: taskData.projectRequirements,
        pointsReward: totalPoints,
        pointsMin: totalPoints,
        pointsRecommended: totalPoints,
        pointsMax: totalPoints,
        taskKind: 'parent',
        parentTaskId: undefined,
        parentTaskTitle: undefined,
        childOrder: 0,
        subtaskCount: subtasks.length,
        siblingCount: 0,
        deadline: taskData.deadline,
      };
      const state = getCurrentState();
      writeExpertState({ ...state, tasks: [parent, ...subtasks, ...state.tasks] });
      return;
    }
    await runMutation(() =>
      apiRequest('/api/tasks/project', {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),
    );
  };

  const updateTask = async (taskId: string, taskData: TaskUpdatePayload) => {
    if (isExpertMode) {
      const state = getCurrentState();
      writeExpertState({
        ...state,
        tasks: state.tasks.map((task) => task.id === taskId ? { ...task, ...taskData, attachments: task.attachments } : task),
      });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
      }),
    );
  };

  const deleteTask = async (taskId: string) => {
    if (isExpertMode) {
      const state = getCurrentState();
      writeExpertState({
        ...state,
        tasks: state.tasks.filter((task) => task.id !== taskId),
        responses: state.responses.filter((response) => response.taskId !== taskId),
      });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      }),
    );
  };

  const addEvent = async (eventData: EventDraft) => {
    await runMutation(() =>
      apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    );
  };

  const updateEvent = async (eventId: string, eventData: EventUpdatePayload) => {
    await runMutation(() =>
      apiRequest(`/api/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      }),
    );
  };

  const deleteEvent = async (eventId: string) => {
    await runMutation(() =>
      apiRequest(`/api/events/${eventId}`, {
        method: 'DELETE',
      }),
    );
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    if (isExpertMode) {
      const state = getCurrentState();
      writeExpertState({ ...state, tasks: state.tasks.map((task) => task.id === taskId ? { ...task, status } : task) });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    );
  };

  const takeTask = async (
    taskId: string,
    _studentId: string,
    _studentName: string,
    coverLetter?: string,
  ) => {
    if (isExpertMode) {
      const state = getCurrentState();
      const response: TaskResponse = {
        id: crypto.randomUUID(),
        taskId,
        studentId: 'expert-student',
        studentName: 'Эксперт Тестовый',
        status: 'accepted',
        coverLetter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        appealCount: 0,
        teamMembers: [{
          id: crypto.randomUUID(), responseId: '', taskId, studentId: 'expert-student',
          studentName: 'Эксперт Тестовый', role: 'leader', createdAt: new Date().toISOString(),
        }],
      };
      response.teamMembers[0].responseId = response.id;
      writeExpertState({
        ...state,
        responses: [response, ...state.responses],
        tasks: state.tasks.map((task) => task.id === taskId ? { ...task, status: 'in_progress', executorId: 'expert-student' } : task),
      });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/tasks/${taskId}/take`, {
        method: 'POST',
        body: JSON.stringify({ coverLetter }),
      }),
    );
  };

  const addTeamMember = async (responseId: string, studentId: string) => {
    await runMutation(() =>
      apiRequest(`/api/task-responses/${responseId}/team-members`, {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      }),
    );
  };

  const removeTeamMember = async (responseId: string, studentId: string) => {
    await runMutation(() =>
      apiRequest(`/api/task-responses/${responseId}/team-members/${studentId}`, {
        method: 'DELETE',
      }),
    );
  };

  const submitTask = async (responseId: string, submissionLink: string) => {
    if (isExpertMode) {
      const state = getCurrentState();
      const response = state.responses.find((item) => item.id === responseId);
      writeExpertState({
        ...state,
        responses: state.responses.map((item) => item.id === responseId ? { ...item, submissionLink, status: 'submitted', updatedAt: new Date().toISOString() } : item),
        tasks: state.tasks.map((task) => task.id === response?.taskId ? { ...task, status: 'review' } : task),
      });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/task-responses/${responseId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ submissionLink }),
      }),
    );
  };

  const reviewTask = async (
    responseId: string,
    status: 'completed' | 'needs_revision',
    comment: string,
  ) => {
    if (isExpertMode) {
      const state = getCurrentState();
      const response = state.responses.find((item) => item.id === responseId);
      writeExpertState({
        ...state,
        responses: state.responses.map((item) => item.id === responseId ? { ...item, status, reviewComment: comment, updatedAt: new Date().toISOString() } : item),
        tasks: state.tasks.map((task) => task.id === response?.taskId ? { ...task, status: status === 'completed' ? 'completed' : 'in_progress' } : task),
      });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/task-responses/${responseId}/review`, {
        method: 'POST',
        body: JSON.stringify({ status, comment }),
      }),
    );
  };

  const appealCompletedTask = async (responseId: string, reason: string) => {
    if (isExpertMode) {
      const state = getCurrentState();
      const response = state.responses.find((item) => item.id === responseId);
      writeExpertState({
        ...state,
        responses: state.responses.map((item) => item.id === responseId ? {
          ...item,
          status: 'needs_revision',
          reviewComment: reason,
          appealReason: reason,
          appealedAt: new Date().toISOString(),
          appealCount: (item.appealCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        } : item),
        tasks: state.tasks.map((task) => task.id === response?.taskId ? { ...task, status: 'in_progress' } : task),
      });
      return;
    }
    await runMutation(() => apiRequest(`/api/task-responses/${responseId}/appeal`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }));
  };

  const registerForEvent = async (eventId: string) => {
    if (isExpertMode) {
      const state = getCurrentState();
      if (state.eventRegistrations.some((item) => item.eventId === eventId && item.studentId === 'expert-student')) {
        return;
      }
      writeExpertState({
        ...state,
        eventRegistrations: [{ id: crypto.randomUUID(), eventId, studentId: 'expert-student', createdAt: new Date().toISOString() }, ...state.eventRegistrations],
        events: state.events.map((event) => event.id === eventId ? { ...event, registrationsCount: event.registrationsCount + 1 } : event),
      });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/events/${eventId}/register`, {
        method: 'POST',
      }),
    );
  };

  const buyProduct = async (productId: string, _price: number) => {
    if (isExpertMode) {
      const state = getCurrentState();
      writeExpertState({
        ...state,
        purchases: [{ id: crypto.randomUUID(), productId, studentId: 'expert-student', price: _price, status: 'pending', createdAt: new Date().toISOString() }, ...state.purchases],
      });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/products/${productId}/buy`, {
        method: 'POST',
      }),
    );
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (isExpertMode) {
      const state = getCurrentState();
      writeExpertState({ ...state, notifications: state.notifications.map((item) => item.id === notificationId ? { ...item, read: true } : item) });
      return;
    }
    await runMutation(() =>
      apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      }),
    );
  };

  return (
    <DataContext.Provider
      value={{
        tasks,
        responses,
        events,
        eventRegistrations,
        products,
        purchases,
        notifications,
        loading,
        addTask,
        publishTaskProject,
        updateTask,
        deleteTask,
        addEvent,
        updateEvent,
        deleteEvent,
        updateTaskStatus,
        takeTask,
        addTeamMember,
        removeTeamMember,
        submitTask,
        reviewTask,
        appealCompletedTask,
        registerForEvent,
        buyProduct,
        markNotificationAsRead,
        studentsDirectory,
        platformStats,
        evidenceStats,
        rewardWinners,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
};
