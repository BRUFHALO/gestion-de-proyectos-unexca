/**
 * Servicio de API para comunicación con el backend
 */

const API_BASE_URL = 'http://localhost:8005';
//const API_BASE_URL = 'https://gestion-de-proyectos-unexca.onrender.com';

export { API_BASE_URL };

// Tipos de datos
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'coordinator';
  university_data: {
    user_id: string;
    enrollment_number?: string;
    employee_number?: string;
    career: string;
    career_code: string;
    faculty: string;
    department?: string;
    category?: string;
    current_trayect?: number;
    current_semester?: number;
    gpa?: number;
    academic_status: string;
  };
  profile?: {
    avatar_url?: string;
    phone?: string;
    bio?: string;
  };
  stats?: {
    projects_submitted?: number;
    projects_evaluated?: number;
    projects_supervised?: number;
    average_grade?: number;
  };
}

export interface Career {
  _id: string;
  code: string;
  name: string;
  faculty: string;
  faculty_code: string;
  description: string;
  active_students: number;
  active_teachers: number;
}

export interface Subject {
  _id: string;
  code: string;
  name: string;
  career_code: string;
  career_name: string;
  trayect: number;
  semester: number;
  is_project_subject: boolean;
  project_type: string;
  credits: number;
  hours_per_week: number;
  description: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  authors: Array<{
    user_id: string;
    name: string;
    role: string;
  }>;
  academic_info: {
    career_code: string;
    career_name: string;
    methodology: string;
    year: number;
    trayect: number;
    semester: number;
    keywords: string[];
    subject?: string;
    subject_code?: string;
  };
  metadata: {
    current_version: number;
    total_versions: number;
    status: string;
  };
  created_at: string;
  updated_at: string;
}

// Funciones de API

/**
 * Realizar petición GET
 */
async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Realizar petición POST
 */
async function post<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Realizar petición PUT
 */
async function put<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// API de Usuarios
export const usersAPI = {
  getAll: (params?: { role?: string; career_code?: string; is_active?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.career_code) queryParams.append('career_code', params.career_code);
    if (params?.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    
    const query = queryParams.toString();
    return get<User[]>(`/api/v1/users${query ? `?${query}` : ''}`);
  },

  getById: (userId: string) => get<User>(`/api/v1/users/${userId}`),

  getByEmail: (email: string) => get<User>(`/api/v1/users/email/${email}`),

  updateProfile: (userId: string, profileData: any) => 
    put(`/api/v1/users/${userId}/profile`, profileData),

  getStats: () => get<{
    total_users: number;
    active_users: number;
    by_role: {
      students: number;
      teachers: number;
      coordinators: number;
    };
  }>('/api/v1/users/stats/summary'),
};

// API de Proyectos
export const projectsAPI = {
  getAll: (params?: { status?: string; career_code?: string; year?: number; created_by?: string; assigned_to?: string; skip?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.career_code) queryParams.append('career_code', params.career_code);
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.created_by) queryParams.append('created_by', params.created_by);
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return get<Project[]>(`/api/v1/projects?${queryParams.toString()}`);
  },

  getById: (projectId: string) => get<Project>(`/api/v1/projects/${projectId}`),

  getVersions: (projectId: string) => get<{
    project_id: string;
    title: string;
    current_version: number;
    total_versions: number;
    versions: Array<{
      version_number: number;
      version_name: string;
      status: string;
      created_at: string;
      grade?: number;
      feedback_count: number;
      files_count: number;
      student_notes?: string;
    }>;
  }>(`/api/v1/projects/${projectId}/versions`),

  getTeacherAssigned: (teacherId: string, status?: string) => {
    const query = status ? `?status=${status}` : '';
    return get<Project[]>(`/api/v1/projects/teacher/${teacherId}/assigned${query}`);
  },

  getStats: () => get<{
    total_projects: number;
    by_status: {
      submitted: number;
      in_review: number;
      approved: number;
      rejected: number;
      published: number;
    };
  }>('/api/v1/projects/stats/summary'),

  uploadProject: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/projects/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al subir el proyecto');
    }

    return response.json();
  },
};

// API de Feedback y Chat
export const feedbackAPI = {
  addFeedback: (data: {
    project_id: string;
    version_number?: number;
    type: 'correction' | 'suggestion' | 'approval';
    comment: string;
    page?: number;
    section?: string;
    anchor?: string;
    created_by: string;
  }) => post('/api/v1/feedback/add', data),

  getProjectFeedback: (projectId: string, version?: number) => 
    get(`/api/v1/feedback/project/${projectId}${version ? `?version=${version}` : ''}`),

  sendChatMessage: (data: {
    project_id: string;
    message: string;
    sender_id: string;
  }) => post('/api/v1/feedback/chat/send', data),

  getChatMessages: (projectId: string) => 
    get(`/api/v1/feedback/chat/${projectId}`),

  getFeedbackStats: (projectId: string) => 
    get(`/api/v1/feedback/stats/${projectId}`),
};

// API de Carreras
export const careersAPI = {
  getAll: (isActive: boolean = true) => 
    get<Career[]>(`/api/v1/careers?is_active=${isActive}`),

  getByCode: (careerCode: string) => get<Career>(`/api/v1/careers/${careerCode}`),

  getSubjects: (careerCode: string, isProjectSubject: boolean = true) => 
    get<Subject[]>(`/api/v1/careers/${careerCode}/subjects?is_project_subject=${isProjectSubject}`),
};

// API de Materias
export const subjectsAPI = {
  getAll: (params?: { 
    career_code?: string; 
    is_project_subject?: boolean;
    trayect?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.career_code) queryParams.append('career_code', params.career_code);
    if (params?.is_project_subject !== undefined) 
      queryParams.append('is_project_subject', String(params.is_project_subject));
    if (params?.trayect) queryParams.append('trayect', String(params.trayect));
    
    const query = queryParams.toString();
    return get<Subject[]>(`/api/v1/subjects${query ? `?${query}` : ''}`);
  },

  getByCode: (subjectCode: string) => get<Subject>(`/api/v1/subjects/${subjectCode}`),
};

// API de Autenticación
export const authAPI = {
  loginWithCedula: (cedula: string, password: string) => 
    post<{
      success: boolean;
      message: string;
      user: User;
    }>('/api/v1/auth/login', { cedula, password }),

  validateCedula: (cedula: string) => 
    post<{
      exists: boolean;
      cedula: string;
      role: string | null;
      name: string | null;
    }>('/api/v1/auth/validate-cedula', { cedula }),

  checkSession: (userId: string) => 
    get<{
      valid: boolean;
      user: User;
    }>(`/api/v1/auth/check-session/${userId}`),
  
  // Método legacy para compatibilidad
  login: (email: string, role?: string) => 
    post<{
      success: boolean;
      message: string;
      user: User;
    }>('/api/v1/auth/login-legacy', { email, role }),
};

// API de Evaluación PDF
export const pdfEvaluationAPI = {
  convertToPDF: (projectId: string) => 
    post(`/api/v1/pdf-evaluation/convert-to-pdf/${projectId}`, {}),

  saveAnnotations: (data: {
    project_id: string;
    annotations: Array<{
      id?: string;
      page: number;
      rect: number[];
      color: string;
      type: string;
      comment: string;
      selected_text?: string;
      author_id: string;
      author_name: string;
      created_at?: string;
    }>;
  }) => post('/api/v1/pdf-evaluation/annotations/save', data),

  getAnnotations: (projectId: string) => 
    get(`/api/v1/pdf-evaluation/annotations/${projectId}`),

  getPDFInfo: (projectId: string) => 
    get(`/api/v1/pdf-evaluation/pdf-info/${projectId}`),

  deleteAnnotation: (annotationId: string) => 
    fetch(`${API_BASE_URL}/api/v1/pdf-evaluation/annotations/${annotationId}`, {
      method: 'DELETE'
    }).then(res => res.json()),
};

// Health check
export const healthAPI = {
  check: () => get<{
    status: string;
    database: string;
    message: string;
  }>('/health'),
};

export default {
  auth: authAPI,
  users: usersAPI,
  projects: projectsAPI,
  careers: careersAPI,
  subjects: subjectsAPI,
  feedback: feedbackAPI,
  pdfEvaluation: pdfEvaluationAPI,
  health: healthAPI,
};
