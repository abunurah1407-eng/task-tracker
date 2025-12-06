import { Engineer, Service, TeamTask } from '../types';

export const engineers: Engineer[] = [
  { id: '1', name: 'Faisal', tasksTotal: 0, color: '#3b82f6' },
  { id: '2', name: 'Abeer', tasksTotal: 0, color: '#8b5cf6' },
  { id: '3', name: 'M. Shahrani', tasksTotal: 0, color: '#ec4899' },
  { id: '4', name: 'Wed', tasksTotal: 0, color: '#f59e0b' },
  { id: '5', name: 'S. Dossari', tasksTotal: 0, color: '#10b981' },
  { id: '6', name: 'Abdullah', tasksTotal: 0, color: '#ef4444' },
  { id: '7', name: 'Milaf', tasksTotal: 0, color: '#06b6d4' },
  { id: '8', name: 'M. Aqily', tasksTotal: 0, color: '#84cc16' },
  { id: '9', name: 'Ghaida', tasksTotal: 0, color: '#f97316' },
  { id: '10', name: 'Amani', tasksTotal: 0, color: '#6366f1' },
  { id: '11', name: 'Menwer', tasksTotal: 0, color: '#14b8a6' },
  { id: '12', name: 'A. Driwesh', tasksTotal: 0, color: '#a855f7' },
  { id: '13', name: 'Aryam', tasksTotal: 0, color: '#eab308' },
];

export const services: Service[] = [
  // Primary services (assigned to engineers)
  { id: '1', name: 'FCR', count: 0, assignedTo: 'Faisal', category: 'primary' },
  { id: '2', name: 'VPN', count: 0, assignedTo: 'Abeer', category: 'primary' },
  { id: '3', name: 'SOC Alerts', count: 0, assignedTo: 'M. Shahrani', category: 'primary' },
  { id: '4', name: 'USB/CD', count: 0, assignedTo: 'Wed', category: 'primary' },
  { id: '5', name: 'URL Filtering', count: 0, assignedTo: 'S. Dossari', category: 'primary' },
  { id: '6', name: 'IoCs', count: 0, assignedTo: 'Abdullah', category: 'primary' },
  { id: '7', name: 'CTI Feeds', count: 0, assignedTo: 'Milaf', category: 'primary' },
  { id: '8', name: 'Threat Analysis', count: 0, assignedTo: 'M. Aqily', category: 'primary' },
  { id: '9', name: 'Vulnerabilities', count: 0, assignedTo: 'Ghaida', category: 'primary' },
  { id: '10', name: 'Sec Support', count: 0, assignedTo: 'Amani', category: 'primary' },
  { id: '11', name: 'Ticket', count: 0, assignedTo: 'Menwer', category: 'primary' },
  { id: '12', name: 'Technical Meeting', count: 0, assignedTo: 'A. Driwesh', category: 'primary' },
  { id: '13', name: 'Sec Investigations', count: 0, assignedTo: 'Aryam', category: 'primary' },
  
  // Secondary services
  { id: '14', name: 'Sec Policy Changes', count: 0, category: 'secondary' },
  { id: '15', name: 'Sec Solution Administration', count: 0, category: 'secondary' },
  { id: '16', name: 'Sec Troubleshooting', count: 0, category: 'secondary' },
  { id: '17', name: 'Sec Implement', count: 0, category: 'secondary' },
  { id: '18', name: 'Cyber Infra', count: 0, category: 'secondary' },
  { id: '19', name: 'IT Infra Review', count: 0, category: 'secondary' },
  { id: '20', name: 'Sec Control Modifications', count: 0, category: 'secondary' },
  { id: '21', name: 'Architect Review', count: 0, category: 'secondary' },
  { id: '22', name: 'Review Cyber Control', count: 0, category: 'secondary' },
  { id: '23', name: 'Sec Comparison', count: 0, category: 'secondary' },
  { id: '24', name: 'Health Check', count: 0, category: 'secondary' },
  { id: '25', name: 'New HLD', count: 0, category: 'secondary' },
  { id: '26', name: 'New LLD', count: 0, category: 'secondary' },
  { id: '27', name: 'GAP Analysis', count: 0, category: 'secondary' },
  { id: '28', name: 'RFP', count: 0, category: 'secondary' },
  { id: '29', name: 'CAB', count: 0, category: 'secondary' },
  { id: '30', name: 'Projects', count: 0, category: 'secondary' },
  { id: '31', name: 'Reporting', count: 0, category: 'secondary' },
  { id: '32', name: 'Compliance', count: 0, category: 'secondary' },
  { id: '33', name: 'CR', count: 0, category: 'secondary' },
  { id: '34', name: 'BRD', count: 0, category: 'secondary' },
  { id: '35', name: 'Encrypted FLASH', count: 0, category: 'secondary' },
  { id: '36', name: 'HASEEN', count: 0, category: 'secondary' },
  { id: '37', name: 'OTHER', count: 0, category: 'secondary' },
];

export const teamTasks: TeamTask[] = [
  { id: '1', category: 'CAB', count: 0, year: 2025 },
  { id: '2', category: 'BRD/CR', count: 0, year: 2025 },
  { id: '3', category: 'Ticket', count: 0, year: 2025 },
  { id: '4', category: 'Request/Orders/MGT', count: 0, year: 2025 },
  { id: '5', category: 'Cyber Actions', count: 0, year: 2025 },
  { id: '6', category: 'Meetings', count: 0, year: 2025 },
  { id: '7', category: 'Cyber INFRA OPS / TICH', count: 0, year: 2025 },
];

export const weeks = [1, 2, 3, 4];


