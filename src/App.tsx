/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { RegisterChoice } from './pages/RegisterChoice';
import { RegisterStudent } from './pages/RegisterStudent';
import { RegisterOrg } from './pages/RegisterOrg';
import { StudentDashboard } from './pages/StudentDashboard';
import { OrgDashboard } from './pages/OrgDashboard';
import { OrgManagement } from './pages/OrgManagement';
import { TaskCatalog } from './pages/TaskCatalog';
import { TaskDetails } from './pages/TaskDetails';
import { CreateTask } from './pages/CreateTask';
import { CreateEvent } from './pages/CreateEvent';
import { Portfolio } from './pages/Portfolio';
import { Events } from './pages/Events';
import { Store } from './pages/Store';
import { Notifications } from './pages/Notifications';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Help } from './pages/Help';
import { Terms } from './pages/Terms';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="вход" element={<Login />} />
              <Route path="регистрация" element={<RegisterChoice />} />
              <Route path="регистрация-студент" element={<RegisterStudent />} />
              <Route path="регистрация-организация" element={<RegisterOrg />} />
              <Route path="студент" element={<StudentDashboard />} />
              <Route path="организация" element={<OrgDashboard />} />
              <Route path="задачи" element={<TaskCatalog />} />
              <Route path="задачи/:id" element={<TaskDetails />} />
              <Route path="организация/задачи" element={<OrgManagement />} />
              <Route path="организация/задачи/новая" element={<CreateTask />} />
              <Route path="организация/задачи/:id/редактировать" element={<CreateTask />} />
              <Route path="организация/мероприятия/новое" element={<CreateEvent />} />
              <Route path="организация/мероприятия/:id/редактировать" element={<CreateEvent />} />
              <Route path="организация/задачи/:id" element={<TaskDetails />} />
              <Route path="портфолио" element={<Portfolio />} />
              <Route path="мероприятия" element={<Events />} />
              <Route path="магазин" element={<Store />} />
              <Route path="уведомления" element={<Notifications />} />
              <Route path="конфиденциальность" element={<PrivacyPolicy />} />
              <Route path="помощь" element={<Help />} />
              <Route path="правила" element={<Terms />} />
              <Route path="*" element={<div className="p-8 text-center text-2xl font-bold">Страница не найдена</div>} />
            </Route>
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
