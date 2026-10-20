import { HonorStudent } from '../types';

const HONOR_BOARD_STORAGE_KEY = 'rehab_quran_honor_board_prod_v1';

// Initial empty honor board for production - students appear only after real achievements
export const INITIAL_HONOR_STUDENTS: HonorStudent[] = [];

export const getWeeklyHonorStudents = (section?: 'male' | 'female' | 'all'): HonorStudent[] => {
  let list: HonorStudent[] = [];
  try {
    const saved = localStorage.getItem(HONOR_BOARD_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      list = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } else {
      list = [];
    }
  } catch (e) {
    console.error('Failed to get honor board', e);
    list = [];
  }

  if (!section || section === 'all') return list;
  return list.filter((s) => s && s.studentSection === section);
};

export const saveHonorBoard = (list: HonorStudent[]) => {
  try {
    localStorage.setItem(HONOR_BOARD_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('rehab_honor_updated', { detail: list }));
  } catch (e) {
    console.error('Failed to save honor board', e);
  }
};

export const congratulateStudent = (studentId: string): number => {
  const current = getWeeklyHonorStudents('all');
  const index = current.findIndex((s) => s.studentId === studentId);
  if (index >= 0) {
    current[index].congratulationsCount += 1;
    saveHonorBoard(current);
    return current[index].congratulationsCount;
  }
  return 0;
};

export const addOrUpdateHonorStudent = (student: HonorStudent) => {
  const current = getWeeklyHonorStudents('all');
  const existingIdx = current.findIndex((s) => s.studentId === student.studentId);
  if (existingIdx >= 0) {
    current[existingIdx] = student;
  } else {
    current.push(student);
  }
  // Sort by average score descending
  current.sort((a, b) => b.averageScore - a.averageScore);
  // Re-rank
  current.forEach((s, idx) => {
    s.rank = idx + 1;
  });
  saveHonorBoard(current);
};
