export interface User {
  id: number;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'user' | 'administrator';
  status: 'active' | 'inactive';
  isVerified: boolean;
  departmentId?: number | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  createdAt?: string;
}

export interface Lab {
  id: number;
  lab_id: string;
  lab_name: string;
  department: string;
  department_id: number | null;
  building_block: string;
  room_number: string;
  capacity: number;
  status: 'active' | 'inactive';
  remarks?: string;
  department_name?: string;
  department_code?: string;
}

export interface TimeSlot {
  id: number;
  period: string;
  start_time: string;
  end_time: string;
  bookable: number;
  display_order: number;
}

export interface Booking {
  id: number;
  booking_id: string;
  date: string;
  lab_id: number;
  slot_id: number;
  faculty_id: number;
  department_id: number;
  year_id: number;
  batch_id: number;
  subject_id: number;
  subject_code?: string;
  expected_students?: number;
  remarks?: string;
  booked_by: number;
  status: 'BOOKED' | 'CANCELLED';
  cancellation_reason?: string;
  cancelled_by?: number;
  cancelled_at?: string;
  modified_by?: number;
  modified_at?: string;
  modification_reason?: string;
  created_at: string;
  
  // Joined details
  lab_name?: string;
  capacity?: number;
  building_block?: string;
  room_number?: string;
  period?: string;
  start_time?: string;
  end_time?: string;
  faculty_name?: string;
  department_name?: string;
  department_code?: string;
  year_name?: string;
  section_name?: string;
  subject_name?: string;
  booked_by_name?: string;
  booked_by_email?: string;
  booked_by_emp_id?: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface Year {
  id: number;
  year_name: string;
  display_order: number;
  status: 'active' | 'inactive';
}

export interface BatchSection {
  id: number;
  department_id: number;
  year_id: number;
  section_name: string;
  status: 'active' | 'inactive';
  department_name?: string;
  department_code?: string;
  year_name?: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  department_id: number;
  status: 'active' | 'inactive';
  department_name?: string;
  department_code?: string;
}

export interface Faculty {
  id: number;
  name: string;
  department_id: number;
  email?: string;
  designation?: string;
  status: 'active' | 'inactive';
  department_name?: string;
  department_code?: string;
}

export interface ScheduleSlot {
  slotId: number;
  period: string;
  startTime: string;
  endTime: string;
  bookable: boolean;
  displayOrder: number;
  status: 'AVAILABLE' | 'BOOKED' | 'BREAK' | 'PAST';
  isPastSlot: boolean;
  booking: Booking | null;
}

export interface ScheduleGridItem {
  lab: Lab;
  slots: ScheduleSlot[];
}

export interface ScheduleResponse {
  success: boolean;
  date: string;
  isToday: boolean;
  isPastDate: boolean;
  timeSlots: TimeSlot[];
  labs: Lab[];
  grid: ScheduleGridItem[];
  stats: {
    totalLabs: number;
    totalBookableSlots: number;
    bookedSlots: number;
    availableSlots: number;
    utilizationPercentage: number;
  };
}

export interface AuditLog {
  id: number;
  booking_id: string;
  action: 'CREATED' | 'MODIFIED' | 'CANCELLED' | 'DELETED' | 'ADMIN_BOOKING_CREATED';
  performed_by: number;
  performed_by_name: string;
  performed_by_role: string;
  performed_by_email?: string;
  timestamp: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
}

export interface SystemSettings {
  id: number;
  college_name: string;
  system_title: string;
  subtitle: string;
  allowed_email_domain: string;
  require_email_domain: number;
  academic_year: string;
  allow_retrospective_booking_admin: number;
}
