import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from './AuthContext';
import type { TaskFormat } from '../lib/tasks';
import type { TaskType, TaskUrgency, TaskWorkload } from '../lib/task-scoring';

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

export interface TaskResponse {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'submitted' | 'completed' | 'needs_revision';
  coverLetter?: string;
  submissionLink?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
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

interface BootstrapPayload {
  tasks: Task[];
  responses: TaskResponse[];
  events: Event[];
  eventRegistrations: EventRegistration[];
  products: Product[];
  purchases: Purchase[];
  notifications: Notification[];
}

interface DataContextType extends BootstrapPayload {
  loading: boolean;
  addTask: (task: TaskDraft) => Promise<void>;
  updateTask: (taskId: string, task: TaskUpdatePayload) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addEvent: (event: EventDraft) => Promise<void>;
  updateEvent: (eventId: string, event: EventUpdatePayload) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  takeTask: (taskId: string, studentId: string, studentName: string, coverLetter?: string) => Promise<void>;
  submitTask: (responseId: string, submissionLink: string) => Promise<void>;
  reviewTask: (responseId: string, status: 'completed' | 'needs_revision', comment: string) => Promise<void>;
  registerForEvent: (eventId: string) => Promise<void>;
  buyProduct: (productId: string, price: number) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const EMPTY_STATE: BootstrapPayload = {
  tasks: [],
  responses: [],
  events: [],
  eventRegistrations: [],
  products: [],
  purchases: [],
  notifications: [],
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [responses, setResponses] = useState<TaskResponse[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const applyState = (data: BootstrapPayload) => {
    setTasks(data.tasks);
    setResponses(data.responses);
    setEvents(data.events);
    setEventRegistrations(data.eventRegistrations);
    setProducts(data.products);
    setPurchases(data.purchases);
    setNotifications(data.notifications);
  };

  const loadData = async () => {
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
        const data = await apiRequest<BootstrapPayload>('/api/bootstrap');
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
  }, [authLoading, user?.id]);

  const runMutation = async (action: () => Promise<unknown>) => {
    await action();
    await loadData();
  };

  const addTask = async (taskData: TaskDraft) => {
    await runMutation(() =>
      apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),
    );
  };

  const updateTask = async (taskId: string, taskData: TaskUpdatePayload) => {
    await runMutation(() =>
      apiRequest(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
      }),
    );
  };

  const deleteTask = async (taskId: string) => {
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
    await runMutation(() =>
      apiRequest(`/api/tasks/${taskId}/take`, {
        method: 'POST',
        body: JSON.stringify({ coverLetter }),
      }),
    );
  };

  const submitTask = async (responseId: string, submissionLink: string) => {
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
    await runMutation(() =>
      apiRequest(`/api/task-responses/${responseId}/review`, {
        method: 'POST',
        body: JSON.stringify({ status, comment }),
      }),
    );
  };

  const registerForEvent = async (eventId: string) => {
    await runMutation(() =>
      apiRequest(`/api/events/${eventId}/register`, {
        method: 'POST',
      }),
    );
  };

  const buyProduct = async (productId: string, _price: number) => {
    await runMutation(() =>
      apiRequest(`/api/products/${productId}/buy`, {
        method: 'POST',
      }),
    );
  };

  const markNotificationAsRead = async (notificationId: string) => {
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
        updateTask,
        deleteTask,
        addEvent,
        updateEvent,
        deleteEvent,
        updateTaskStatus,
        takeTask,
        submitTask,
        reviewTask,
        registerForEvent,
        buyProduct,
        markNotificationAsRead,
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
