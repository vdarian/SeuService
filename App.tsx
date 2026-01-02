
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Briefcase, 
  LayoutDashboard, 
  PlusCircle, 
  ChevronRight, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  DollarSign,
  Calendar,
  History,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ChevronDown,
  Wallet,
  CheckCircle,
  Trophy,
  Cake,
  Gift,
  IdCard,
  User,
  Settings,
  Store,
  Save,
  Edit2
} from 'lucide-react';
import { Client, Service, ServiceStatus, PaymentStatus, PaymentMethod, Installment, UserProfile } from './types';
import { getClients, getServices, saveClients, saveServices, generateId, getUserProfile, saveUserProfile } from './utils/storage';

// --- Helpers ---

const getDaysUntilBirthday = (birthDateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const birthDate = new Date(birthDateStr);
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextBirthday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- Views ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'services' | 'birthdays' | 'profile'>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Modals
  const [showClientModal, setShowClientModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    setClients(getClients());
    setServices(getServices());
  }, []);

  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  useEffect(() => {
    saveServices(services);
  }, [services]);

  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: generateId(),
      createdAt: Date.now()
    };
    setClients([...clients, newClient]);
    return newClient;
  };

  const addService = (serviceData: Omit<Service, 'id' | 'createdAt' | 'installments'>, installmentCount?: number, firstDueDate?: string) => {
    const installments: Installment[] = [];
    const serviceId = generateId();

    if (serviceData.paymentMethod === PaymentMethod.PARCELAMENTO_PROPRIO && installmentCount && firstDueDate) {
      const amountPerInstallment = serviceData.totalValue / installmentCount;
      for (let i = 1; i <= installmentCount; i++) {
        const dueDate = new Date(firstDueDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        
        installments.push({
          id: generateId(),
          serviceId,
          number: i,
          amount: amountPerInstallment,
          dueDate: dueDate.toISOString().split('T')[0],
          status: PaymentStatus.PENDENTE
        });
      }
    }

    const newService: Service = {
      ...serviceData,
      id: serviceId,
      installments,
      createdAt: Date.now()
    };
    setServices([...services, newService]);
  };

  const updateServiceStatus = (serviceId: string, status: ServiceStatus) => {
    setServices(services.map(s => s.id === serviceId ? { ...s, serviceStatus: status } : s));
  };

  const updatePaymentStatus = (serviceId: string, status: PaymentStatus) => {
    setServices(services.map(s => s.id === serviceId ? { ...s, paymentStatus: status } : s));
  };

  const updateInstallmentStatus = (serviceId: string, installmentId: string, status: PaymentStatus) => {
    setServices(services.map(s => {
      if (s.id === serviceId) {
        const newInstallments = s.installments.map(inst => 
          inst.id === installmentId ? { ...inst, status } : inst
        );
        const allPaid = newInstallments.every(i => i.status === PaymentStatus.PAGO || i.status === PaymentStatus.QUITADO);
        return { 
          ...s, 
          installments: newInstallments,
          paymentStatus: allPaid ? PaymentStatus.QUITADO : s.paymentStatus
        };
      }
      return s;
    }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfile(userProfile);
    setIsEditingProfile(false);
  };

  // Birthdays Logic
  const birthdayReminders = useMemo(() => {
    return clients.filter(c => {
      if (!c.birthDate) return false;
      const days = getDaysUntilBirthday(c.birthDate);
      return days <= 7;
    }).sort((a, b) => getDaysUntilBirthday(a.birthDate!) - getDaysUntilBirthday(b.birthDate!));
  }, [clients]);

  // Components Render Logic
  const renderDashboard = () => {
    const totalRevenue = services.reduce((acc, s) => acc + s.totalValue, 0);
    const pendingServicesCount = services.filter(s => s.serviceStatus === ServiceStatus.EM_ANDAMENTO).length;
    const finalizedServicesCount = services.filter(s => s.serviceStatus === ServiceStatus.FINALIZADO).length;
    
    const paidCount = services.filter(s => s.paymentStatus === PaymentStatus.PAGO).length;
    const pendingCount = services.filter(s => s.paymentStatus === PaymentStatus.PENDENTE).length;
    const overdueCount = services.filter(s => s.paymentStatus === PaymentStatus.EM_ATRASO).length;
    const settledCount = services.filter(s => s.paymentStatus === PaymentStatus.QUITADO).length;

    return (
      <div className="space-y-6">
        {/* Birthday Alert */}
        {birthdayReminders.length > 0 && (
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 rounded-2xl shadow-lg shadow-rose-100 flex items-center justify-between text-white animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Cake size={24} />
              </div>
              <div>
                <p className="font-bold">Aniversariantes Próximos!</p>
                <p className="text-sm text-white/80">
                  {getDaysUntilBirthday(birthdayReminders[0].birthDate!) === 0 
                    ? `Hoje é aniversário de ${birthdayReminders[0].name}!` 
                    : `${birthdayReminders[0].name} faz aniversário em ${getDaysUntilBirthday(birthdayReminders[0].birthDate!)} dias.`}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('birthdays')}
              className="bg-white text-rose-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors"
            >
              Ver todos
            </button>
          </div>
        )}

        {/* Main Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Receita Bruta Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Serviços em Execução</p>
              <p className="text-2xl font-bold text-gray-900">{pendingServicesCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Serviços Finalizados</p>
              <p className="text-2xl font-bold text-gray-900">{finalizedServicesCount}</p>
            </div>
          </div>
        </div>

        {/* Payment Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pagos</p>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pendentes</p>
              <Clock size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Em Atraso</p>
              <AlertCircle size={18} className="text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600">{overdueCount}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quitados</p>
              <Wallet size={18} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{settledCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Atividades Recentes</h3>
            <button 
              onClick={() => setActiveTab('services')}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              Ver tudo
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {services.slice(-5).reverse().map(service => {
              const client = clients.find(c => c.id === service.clientId);
              return (
                <div key={service.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                      {client?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{service.type}</p>
                      <p className="text-sm text-gray-500">{client?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">R$ {service.totalValue.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      service.paymentStatus === PaymentStatus.PAGO || service.paymentStatus === PaymentStatus.QUITADO 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : service.paymentStatus === PaymentStatus.EM_ATRASO 
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {service.paymentStatus}
                    </span>
                  </div>
                </div>
              );
            })}
            {services.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Nenhum serviço registrado ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="text-blue-600" /> Meu Perfil
          </h2>
          {!isEditingProfile && (
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-colors"
            >
              <Edit2 size={16} /> Editar Perfil
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-6">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center p-1">
                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  {userProfile.logoUrl ? (
                    <img src={userProfile.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Store size={40} />
                  )}
                </div>
              </div>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Seu Nome</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                      value={userProfile.name}
                      onChange={e => setUserProfile({...userProfile, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Nome da Empresa</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                      value={userProfile.businessName}
                      onChange={e => setUserProfile({...userProfile, businessName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
                    <input 
                      type="email" 
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                      value={userProfile.email}
                      onChange={e => setUserProfile({...userProfile, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Telefone</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                      value={userProfile.phone}
                      onChange={e => setUserProfile({...userProfile, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Endereço Comercial</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                    value={userProfile.address || ''}
                    onChange={e => setUserProfile({...userProfile, address: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                  >
                    <Save size={18} /> Salvar Alterações
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 bg-gray-100 text-gray-600 p-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{userProfile.businessName}</h3>
                  <p className="text-gray-500">{userProfile.name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Mail size={20} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">E-mail de Contato</p>
                      <p className="font-medium">{userProfile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Phone size={20} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Telefone</p>
                      <p className="font-medium">{userProfile.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><MapPin size={20} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Localização</p>
                      <p className="font-medium">{userProfile.address || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="text-blue-600" size={20} />
                    <h4 className="font-bold text-blue-900">Resumo da Conta</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                      <p className="text-xs text-gray-400 font-bold uppercase">Total Clientes</p>
                      <p className="text-xl font-bold text-blue-600">{clients.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                      <p className="text-xs text-gray-400 font-bold uppercase">Serviços Totais</p>
                      <p className="text-xl font-bold text-blue-600">{services.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderClients = () => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      const clientServices = services.filter(s => s.clientId === selectedClientId);
      
      return (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedClientId(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="rotate-180" size={20} />
            <span>Voltar para Clientes</span>
          </button>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {client?.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{client?.name}</h2>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-gray-500 flex items-center gap-1 text-sm">
                      <MapPin size={14} /> {client?.address || 'Endereço não informado'}
                    </p>
                    {client?.cpf && (
                      <p className="text-gray-500 flex items-center gap-1 text-sm">
                        <IdCard size={14} /> CPF: {client.cpf}
                      </p>
                    )}
                    {client?.birthDate && (
                      <p className="text-gray-500 flex items-center gap-1 text-sm">
                        <Cake size={14} /> Nasc: {new Date(client.birthDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                  <Phone size={18} className="text-gray-400" />
                  <span className="font-medium">{client?.phone}</span>
                </div>
                {client?.email && (
                  <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                    <Mail size={18} className="text-gray-400" />
                    <span className="font-medium">{client.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold flex items-center gap-2"><History size={20} /> Histórico de Serviços</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {clientServices.map(service => (
              <div key={service.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold">{service.type}</h4>
                    <p className="text-gray-500 text-sm">Contratado em: {new Date(service.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      service.serviceStatus === ServiceStatus.CONCLUIDO || service.serviceStatus === ServiceStatus.FINALIZADO 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {service.serviceStatus}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      service.paymentStatus === PaymentStatus.PAGO || service.paymentStatus === PaymentStatus.QUITADO
                        ? 'bg-green-100 text-green-700' 
                        : service.paymentStatus === PaymentStatus.EM_ATRASO
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {service.paymentStatus}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Valor Total</p>
                    <p className="text-lg font-bold">R$ {service.totalValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Duração</p>
                    <p className="text-lg font-bold">{service.duration || 'Não informada'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pagamento</p>
                    <p className="text-lg font-bold">{service.paymentMethod}</p>
                  </div>
                </div>

                {service.paymentMethod === PaymentMethod.PARCELAMENTO_PROPRIO && service.installments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-bold mb-3">Controle de Parcelas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {service.installments.map(inst => (
                        <div key={inst.id} className="p-3 border rounded-xl flex justify-between items-center text-sm">
                          <div>
                            <p className="font-bold">Parcela {inst.number}</p>
                            <p className="text-gray-500">{new Date(inst.dueDate).toLocaleDateString()}</p>
                          </div>
                          <select 
                            value={inst.status}
                            onChange={(e) => updateInstallmentStatus(service.id, inst.id, e.target.value as PaymentStatus)}
                            className={`p-1 rounded text-xs font-bold border-none focus:ring-2 focus:ring-blue-200 cursor-pointer ${
                              inst.status === PaymentStatus.PAGO ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                            }`}
                          >
                            <option value={PaymentStatus.PENDENTE}>Pendente</option>
                            <option value={PaymentStatus.PAGO}>Pago</option>
                            <option value={PaymentStatus.EM_ATRASO}>Atraso</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {clientServices.length === 0 && (
              <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-dashed">
                <p className="text-gray-400">Nenhum serviço registrado para este cliente.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Clientes</h2>
          <button 
            onClick={() => setShowClientModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={20} /> Novo Cliente
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente por nome, cpf, email..."
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Nome</th>
                  <th className="px-6 py-4 font-bold">CPF / Contato</th>
                  <th className="px-6 py-4 font-bold">Endereço</th>
                  <th className="px-6 py-4 font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <span className="font-semibold">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{client.phone}</p>
                      <p className="text-xs text-gray-400">{client.cpf || 'Sem CPF'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {client.address || 'Não informado'}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedClientId(client.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Ver Detalhes <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderBirthdays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    
    const monthlyBirthdays = clients
      .filter(c => c.birthDate && new Date(c.birthDate).getMonth() === currentMonth)
      .sort((a, b) => new Date(a.birthDate!).getDate() - new Date(b.birthDate!).getDate());

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-100 text-pink-600 rounded-xl">
            <Cake size={24} />
          </div>
          <h2 className="text-2xl font-bold">Aniversariantes do Mês</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyBirthdays.map(client => {
            const daysLeft = getDaysUntilBirthday(client.birthDate!);
            const isToday = daysLeft === 0;
            
            return (
              <div 
                key={client.id} 
                className={`p-6 rounded-2xl shadow-sm border transition-all ${
                  isToday 
                  ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-100' 
                  : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                    isToday ? 'bg-rose-500 text-white' : 'bg-pink-100 text-pink-600'
                  }`}>
                    {new Date(client.birthDate!).getDate()}
                  </div>
                  {isToday && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Hoje!</span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-gray-900">{client.name}</h4>
                <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                  <Phone size={14} /> {client.phone}
                </p>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">Faltam</span>
                  <span className={`font-bold ${isToday ? 'text-rose-600' : 'text-gray-900'}`}>
                    {isToday ? 'É HOJE!' : `${daysLeft} dias`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {monthlyBirthdays.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
            <div className="flex justify-center mb-4"><Gift size={48} className="text-gray-300" /></div>
            <p className="text-gray-400">Nenhum aniversariante encontrado neste mês.</p>
          </div>
        )}
      </div>
    );
  };

  const renderServices = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Serviços</h2>
          <button 
            onClick={() => setShowServiceModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={20} /> Cadastrar Serviço
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {services.slice().reverse().map(service => {
            const client = clients.find(c => c.id === service.clientId);
            return (
              <div key={service.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{service.type}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{client?.name}</span>
                        {service.duration && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{service.duration}</span>
                          </>
                        )}
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{new Date(service.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status do Serviço</p>
                      <select 
                        value={service.serviceStatus}
                        onChange={(e) => updateServiceStatus(service.id, e.target.value as ServiceStatus)}
                        className={`text-sm px-3 py-1.5 rounded-xl font-bold border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-200 cursor-pointer ${
                          service.serviceStatus === ServiceStatus.CONCLUIDO ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {Object.values(ServiceStatus).map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status Pagamento</p>
                      <select 
                        value={service.paymentStatus}
                        onChange={(e) => updatePaymentStatus(service.id, e.target.value as PaymentStatus)}
                        className={`text-sm px-3 py-1.5 rounded-xl font-bold border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-200 cursor-pointer ${
                          service.paymentStatus === PaymentStatus.PAGO || service.paymentStatus === PaymentStatus.QUITADO ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {Object.values(PaymentStatus).map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>

                    <div className="text-right ml-auto md:ml-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
                      <p className="text-xl font-bold text-gray-900">R$ {service.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>

                {service.paymentMethod === PaymentMethod.PARCELAMENTO_PROPRIO && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span>Parcelamento Próprio: {service.installments.filter(i => i.status === PaymentStatus.PAGO).length} de {service.installments.length} pagas</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedClientId(service.clientId);
                        setActiveTab('clients');
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Gerenciar Parcelas
                    </button>
                  </div>
                )}
              </div>
            ))}
            {services.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
                <p className="text-gray-400">Nenhum serviço cadastrado.</p>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen flex bg-gray-50">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 lg:translate-x-0 lg:static
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col">
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-200">
                S
              </div>
              <h1 className="text-xl font-bold text-gray-900">Seu Service</h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
              <button 
                onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <LayoutDashboard size={20} />
                <span className="font-semibold">Painel Geral</span>
              </button>
              <button 
                onClick={() => { setActiveTab('clients'); setIsSidebarOpen(false); setSelectedClientId(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'clients' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Users size={20} />
                <span className="font-semibold">Clientes</span>
              </button>
              <button 
                onClick={() => { setActiveTab('services'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'services' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Briefcase size={20} />
                <span className="font-semibold">Serviços</span>
              </button>
              <button 
                onClick={() => { setActiveTab('birthdays'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'birthdays' ? 'bg-pink-600 text-white shadow-md shadow-pink-100' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Cake size={20} />
                <span className="font-semibold">Aniversariantes</span>
              </button>
              <button 
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <User size={20} />
                <span className="font-semibold">Meu Perfil</span>
              </button>
            </nav>

            <div className="p-4 border-t border-gray-100">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">{userProfile.businessName}</p>
                <p className="text-xs text-blue-700">Bem-vindo(a), {userProfile.name.split(' ')[0]}!</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between lg:justify-end">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{userProfile.name}</p>
                <p className="text-xs text-gray-500">{userProfile.businessName}</p>
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
              >
                <User size={20} />
              </button>
            </div>
          </header>

          <div className="p-6 max-w-7xl mx-auto">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'clients' && renderClients()}
            {activeTab === 'services' && renderServices()}
            {activeTab === 'birthdays' && renderBirthdays()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </main>

        {/* Modals */}
        {showClientModal && (
          <ClientModal 
            onClose={() => setShowClientModal(false)} 
            onSubmit={(data) => {
              addClient(data);
              setShowClientModal(false);
            }} 
          />
        )}
        
        {showServiceModal && (
          <ServiceModal 
            clients={clients} 
            onClose={() => setShowServiceModal(false)} 
            onAddClient={(data) => addClient(data)}
            onSubmit={(serviceData, count, date) => {
              addService(serviceData, count, date);
              setShowServiceModal(false);
            }} 
          />
        )}
      </div>
    );
};

// --- Modal Components ---

interface ClientModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<Client, 'id' | 'createdAt'>) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cpf: '',
    birthDate: ''
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold">Cadastrar Cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
            <input required type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Telefone</label>
              <input required type="tel" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">CPF (Opcional)</label>
              <input type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="000.000.000-00" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Data Nasc. (Opcional)</label>
              <input type="date" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">E-mail (Opcional)</label>
              <input type="email" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="joao@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Endereço (Opcional)</label>
            <input type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Rua, Número, Bairro, Cidade" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">
            Salvar Cliente
          </button>
        </form>
      </div>
    </div>
  );
};

interface ServiceModalProps {
  clients: Client[];
  onClose: () => void;
  onAddClient: (data: Omit<Client, 'id' | 'createdAt'>) => Client;
  onSubmit: (data: Omit<Service, 'id' | 'createdAt' | 'installments'>, installmentCount?: number, firstDueDate?: string) => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ clients, onClose, onSubmit, onAddClient }) => {
  const [showClientForm, setShowClientForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    type: '',
    totalValue: 0,
    duration: '',
    serviceStatus: ServiceStatus.EM_ANDAMENTO,
    paymentMethod: PaymentMethod.DINHEIRO,
    paymentStatus: PaymentStatus.PENDENTE,
  });

  const [installmentCount, setInstallmentCount] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [newClientData, setNewClientData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cpf: '',
    birthDate: ''
  });

  const handleCreateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalClientId = formData.clientId;
    
    if (showClientForm) {
      const createdClient = onAddClient(newClientData);
      finalClientId = createdClient.id;
    }

    if (!finalClientId) return alert('Selecione ou cadastre um cliente');

    onSubmit(
      { ...formData, clientId: finalClientId },
      formData.paymentMethod === PaymentMethod.PARCELAMENTO_PROPRIO ? installmentCount : undefined,
      formData.paymentMethod === PaymentMethod.PARCELAMENTO_PROPRIO ? firstDueDate : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold">Cadastrar Novo Serviço</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form className="p-6 space-y-6" onSubmit={handleCreateAndSubmit}>
          
          {/* Cliente Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Informações do Cliente</label>
              <button 
                type="button" 
                onClick={() => setShowClientForm(!showClientForm)}
                className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg"
              >
                {showClientForm ? 'Vincular Existente' : '+ Novo Cliente'}
              </button>
            </div>
            
            {!showClientForm ? (
              <select 
                required 
                className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 appearance-none bg-white"
                value={formData.clientId}
                onChange={e => setFormData({...formData, clientId: e.target.value})}
              >
                <option value="">Selecione um cliente cadastrado...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <input required placeholder="Nome do Cliente" className="p-2.5 border rounded-lg text-sm" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} />
                <input required placeholder="Telefone" className="p-2.5 border rounded-lg text-sm" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} />
                <input placeholder="CPF (Opcional)" className="p-2.5 border rounded-lg text-sm" value={newClientData.cpf} onChange={e => setNewClientData({...newClientData, cpf: e.target.value})} />
                <input placeholder="Data Nasc (Opcional)" type="date" className="p-2.5 border rounded-lg text-sm" value={newClientData.birthDate} onChange={e => setNewClientData({...newClientData, birthDate: e.target.value})} />
                <input placeholder="E-mail (Opcional)" type="email" className="p-2.5 border rounded-lg text-sm" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} />
                <input placeholder="Endereço (Opcional)" className="p-2.5 border rounded-lg text-sm" value={newClientData.address} onChange={e => setNewClientData({...newClientData, address: e.target.value})} />
              </div>
            )}
          </div>

          {/* Serviço Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tipo de Serviço</label>
              <input required type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ex: Consultoria, Limpeza, etc" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tempo de Duração (Opcional)</label>
              <input type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ex: 2 horas, 3 dias" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Valor Total (R$)</label>
              <input required type="number" step="0.01" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" placeholder="0,00" value={formData.totalValue || ''} onChange={e => setFormData({...formData, totalValue: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Status do Serviço</label>
              <select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={formData.serviceStatus} onChange={e => setFormData({...formData, serviceStatus: e.target.value as ServiceStatus})}>
                {Object.values(ServiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Pagamento Section */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Informações de Pagamento</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Forma de Pagamento</label>
                <select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}>
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Status Inicial</label>
                <select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value as PaymentStatus})}>
                  {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {formData.paymentMethod === PaymentMethod.PARCELAMENTO_PROPRIO && (
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-600 uppercase">Número de Parcelas</label>
                    <input type="number" min="1" max="60" className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-200" value={installmentCount} onChange={e => setInstallmentCount(parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-600 uppercase">Primeiro Vencimento</label>
                    <input type="date" className="w-full p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-200" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="mt-3 text-xs text-blue-600 font-medium">
                  Parcelas de R$ {(formData.totalValue / (installmentCount || 1)).toFixed(2)} cada.
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-xl shadow-blue-100 mt-4">
            Finalizar Cadastro do Serviço
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
