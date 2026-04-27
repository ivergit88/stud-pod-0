import type { TaskResponse } from '../context/DataContext';

export function getResponseMembers(response: TaskResponse) {
  return response.teamMembers || [];
}

export function isStudentInResponse(response: TaskResponse, studentId: string) {
  return getResponseMembers(response).some((member) => member.studentId === studentId);
}

export function isResponseLeader(response: TaskResponse, studentId: string) {
  return getResponseMembers(response).some(
    (member) => member.studentId === studentId && member.role === 'leader',
  );
}
