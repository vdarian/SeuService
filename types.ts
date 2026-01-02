
export enum ServiceStatus {
  CONCLUIDO = 'Concluído',
  EM_ANDAMENTO = 'Em andamento',
  FINALIZADO = 'Finalizado'
}

export enum PaymentStatus {
  PAGO = 'Pago',
  PENDENTE = 'Pendente',
  EM_ATRASO = 'Em atraso',
  QUITADO = 'Quitado'
}

export enum PaymentMethod {
  DINHEIRO = 'Dinheiro',
  CARTAO = 'Cartão',
  PARCELAMENTO_PROPRIO = 'Parcelamento Próprio'
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  cpf?: string;
  birthDate?: string;
  createdAt: number;
}

export interface Installment {
  id: string;
  serviceId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
}

export interface Service {
  id: string;
  clientId: string;
  type: string;
  totalValue: number;
  duration?: string;
  serviceStatus: ServiceStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  installments: Installment[];
  createdAt: number;
}

export interface UserProfile {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address?: string;
  logoUrl?: string;
}
