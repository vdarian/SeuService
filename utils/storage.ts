
import { Client, Service, UserProfile } from '../types';

const CLIENTS_KEY = 'sm_pro_clients';
const SERVICES_KEY = 'sm_pro_services';
const PROFILE_KEY = 'sm_pro_profile';

export const saveClients = (clients: Client[]) => {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

export const getClients = (): Client[] => {
  const data = localStorage.getItem(CLIENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveServices = (services: Service[]) => {
  localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
};

export const getServices = (): Service[] => {
  const data = localStorage.getItem(SERVICES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getUserProfile = (): UserProfile => {
  const data = localStorage.getItem(PROFILE_KEY);
  if (data) return JSON.parse(data);
  return {
    name: 'Administrador',
    businessName: 'Meu Negócio',
    email: 'admin@exemplo.com',
    phone: '(00) 00000-0000',
    address: 'Rua Principal, 123'
  };
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
