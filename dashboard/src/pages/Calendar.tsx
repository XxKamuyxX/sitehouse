import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useState, useEffect } from 'react';
import { getDocs, addDoc, updateDoc, doc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import { Calendar as BigCalendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X, ChevronLeft, ChevronRight, Plus, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { queryWithCompanyId } from '../lib/queries';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

// Configure moment for pt-BR and 24h format
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface WorkOrder {
  id: string;
  quoteId?: string;
  clientId?: string;
  clientName: string;
  scheduledDate: string;
  scheduledTime?: string;
  technician?: string;
  technicianId?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  items?: any[];
  total?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: WorkOrder;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

interface Technician {
  id: string;
  name: string;
  email: string;
}

export function Calendar() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  
  // New event form state
  const [newEventType, setNewEventType] = useState<'work-order' | 'quote'>('work-order');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  // Set default view based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // On mobile, default to agenda view (list)
        if (currentView === 'month' || currentView === 'week') {
          setCurrentView('agenda');
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentView]);
  
  // Set initial view based on screen size
  useEffect(() => {
    if (window.innerWidth < 768) {
      setCurrentView('agenda');
    }
  }, []);

  useEffect(() => {
    if (companyId) {
      loadWorkOrders();
      loadClients();
      loadTechnicians();
    }
  }, [companyId]);

  const loadClients = async () => {
    if (!companyId) return;
    try {
      const q = queryWithCompanyId('clients', companyId);
      const snapshot = await getDocs(q);
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadTechnicians = async () => {
    if (!companyId) return;
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyId', '==', companyId),
        where('role', 'in', ['technician', 'admin', 'owner'])
      );
      const snapshot = await getDocs(usersQuery);
      const techs = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || doc.data().email || 'Sem nome',
        email: doc.data().email || '',
      })) as Technician[];
      setTechnicians(techs);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const loadWorkOrders = async () => {
    if (!companyId) return;
    
    try {
      const q = queryWithCompanyId('workOrders', companyId);
      const snapshot = await getDocs(q);
      const workOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WorkOrder[];

      const calendarEvents: CalendarEvent[] = workOrders
        .filter((wo) => wo.scheduledDate)
        .map((wo) => {
          const scheduledDate = new Date(wo.scheduledDate);
          
          // Parse time if available
          if (wo.scheduledTime) {
            const [hours, minutes] = wo.scheduledTime.split(':').map(Number);
            scheduledDate.setHours(hours || 9, minutes || 0, 0, 0);
          } else {
            scheduledDate.setHours(9, 0, 0, 0); // Default 9 AM
          }

          const end = new Date(scheduledDate);
          end.setHours(end.getHours() + 2); // Default 2 hour duration

          return {
            id: wo.id,
            title: wo.clientName || 'Cliente',
            start: scheduledDate,
            end,
            resource: wo,
          };
        });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    // Pre-fill times from selected slot
    setEventStartTime(moment(slotInfo.start).format('HH:mm'));
    const endTime = moment(slotInfo.end || slotInfo.start).add(2, 'hours');
    setEventEndTime(endTime.format('HH:mm'));
    setShowCreateModal(true);
  };

  const handleCreateEvent = async () => {
    if (!selectedClientId || !selectedSlot || !companyId) {
      alert('Selecione um cliente e horário');
      return;
    }

    setSaving(true);
    try {
      const selectedClient = clients.find((c) => c.id === selectedClientId);
      if (!selectedClient) {
        alert('Cliente não encontrado');
        return;
      }

      const startDate = moment(selectedSlot.start);
      if (eventStartTime) {
        const [hours, minutes] = eventStartTime.split(':').map(Number);
        startDate.hours(hours).minutes(minutes).seconds(0);
      }

      if (newEventType === 'work-order') {
        // Create Work Order
        const workOrderData = {
          clientId: selectedClientId,
          clientName: selectedClient.name,
          clientPhone: selectedClient.phone || '',
          clientAddress: selectedClient.address || '',
          scheduledDate: startDate.format('YYYY-MM-DD'),
          scheduledTime: eventStartTime || '09:00',
          technician: selectedTechnicianId ? technicians.find((t) => t.id === selectedTechnicianId)?.name || '' : '',
          technicianId: selectedTechnicianId || '',
          status: 'scheduled' as const,
          checklist: [],
          notes: '',
          companyId: companyId,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'workOrders'), workOrderData);
        alert('Agendamento criado com sucesso!');
        navigate(`/work-orders/${docRef.id}`);
      } else {
        // Create Quote (navigate to quote creation with client pre-selected)
        navigate(`/quotes/new?clientId=${selectedClientId}`);
      }
      
      setShowCreateModal(false);
      setSelectedClientId('');
      setSelectedTechnicianId('');
      loadWorkOrders();
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(`Erro ao criar agendamento: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTechnician = async (technicianId: string) => {
    if (!selectedEvent || !companyId) return;

    try {
      const technician = technicians.find((t) => t.id === technicianId);
      await updateDoc(doc(db, 'workOrders', selectedEvent.id), {
        technicianId: technicianId,
        technician: technician?.name || '',
      });
      
      alert('Técnico atualizado com sucesso!');
      setShowEventModal(false);
      setSelectedEvent(null);
      loadWorkOrders();
    } catch (error) {
      console.error('Error updating technician:', error);
      alert('Erro ao atualizar técnico');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let className = '';
    
    if (status === 'completed') {
      className = 'bg-green-100 text-green-700 border-l-4 border-green-500';
    } else if (status === 'in-progress') {
      className = 'bg-orange-100 text-orange-700 border-l-4 border-orange-500';
    } else {
      className = 'bg-blue-100 text-blue-700 border-l-4 border-blue-500';
    }

    return {
      className,
      style: {
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '0.875rem',
      },
    };
  };

  // Custom Toolbar Component
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const goToView = (view: View) => {
      toolbar.onView(view);
    };

    const label = () => {
      // Format: "Janeiro 2026" (capitalized)
      const formatted = moment(toolbar.date).format('MMMM YYYY');
      // Capitalize first letter
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-b border-slate-200">
        {/* Left: Title */}
        <div>
          <h2 className="text-2xl font-bold text-navy">{label()}</h2>
        </div>

        {/* Right: Navigation & View Switcher */}
        <div className="flex items-center gap-2">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium"
            >
              Hoje
            </button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* View Switcher - Hide Month/Week on mobile */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {/* Month - Hidden on mobile */}
            <button
              onClick={() => goToView('month')}
              className={`hidden md:block px-3 py-1 rounded text-sm font-medium transition-colors ${
                toolbar.view === 'month' ? 'bg-white text-navy shadow-sm' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Mês
            </button>
            {/* Week - Hidden on mobile */}
            <button
              onClick={() => goToView('week')}
              className={`hidden md:block px-3 py-1 rounded text-sm font-medium transition-colors ${
                toolbar.view === 'week' ? 'bg-white text-navy shadow-sm' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Semana
            </button>
            {/* Day - Always visible */}
            <button
              onClick={() => goToView('day')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                toolbar.view === 'day' ? 'bg-white text-navy shadow-sm' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Dia
            </button>
            {/* Agenda/List - Always visible */}
            <button
              onClick={() => goToView('agenda')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                toolbar.view === 'agenda' ? 'bg-white text-navy shadow-sm' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Custom Event Component to show technician
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const technician = event.resource.technician;
    return (
      <div className="flex items-center gap-1">
        <span className="truncate">{event.title}</span>
        {technician && (
          <span className="text-xs opacity-75 flex items-center gap-1">
            <User className="w-3 h-3" />
            {technician}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando agenda...</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        <div>
          <h1 className="text-3xl font-bold text-navy">Agenda</h1>
          <p className="text-slate-600 mt-1">Visualize e gerencie todas as ordens de serviço agendadas</p>
        </div>

        <Card className="p-0 overflow-hidden">
          <div style={{ height: '600px', minHeight: '400px' }}>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar,
                event: EventComponent,
              }}
              messages={{
                next: 'Próximo',
                previous: 'Anterior',
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Lista',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                allDay: 'Dia Inteiro',
                work_week: 'Semana de Trabalho',
                noEventsInRange: 'Nenhum compromisso para este período. Toque no + para agendar.',
              }}
              formats={{
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
                dayFormat: 'dddd, DD',
                dayHeaderFormat: 'dddd, DD',
                dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM')}`,
                monthHeaderFormat: 'MMMM YYYY',
                agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM')}`,
                agendaTimeFormat: 'HH:mm',
                agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
              }}
              onDrillDown={() => {
                // Disable automatic navigation to day view on click
                return null;
              }}
              drilldownView={null}
            />
          </div>
        </Card>

        {/* Create Event Modal */}
        {showCreateModal && selectedSlot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">Novo Agendamento</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedSlot(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Event Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewEventType('work-order')}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                        newEventType === 'work-order'
                          ? 'border-navy bg-navy-50 text-navy font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Visita Técnica (OS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEventType('quote')}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                        newEventType === 'quote'
                          ? 'border-navy bg-navy-50 text-navy font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Orçamento
                    </button>
                  </div>
                </div>

                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Technician Selection (only for work orders) */}
                {newEventType === 'work-order' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Técnico Responsável</label>
                    <select
                      value={selectedTechnicianId}
                      onChange={(e) => setSelectedTechnicianId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    >
                      <option value="">Não atribuído</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
                    <input
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
                    <input
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedSlot(null);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateEvent}
                    disabled={saving || !selectedClientId}
                    className="flex-1"
                  >
                    {saving ? 'Salvando...' : 'Criar Agendamento'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">Detalhes do Serviço</h2>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Cliente:</p>
                  <p className="font-medium text-navy">{selectedEvent.resource.clientName}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Data Agendada:</p>
                  <p className="font-medium text-navy">
                    {moment(selectedEvent.start).format('DD/MM/YYYY [às] HH:mm')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-600 mb-1">Técnico Responsável:</p>
                  <select
                    value={selectedEvent.resource.technicianId || ''}
                    onChange={(e) => handleUpdateTechnician(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    <option value="">Não atribuído</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Status:</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.resource.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : selectedEvent.resource.status === 'in-progress'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {selectedEvent.resource.status === 'completed'
                      ? 'Concluído'
                      : selectedEvent.resource.status === 'in-progress'
                      ? 'Em Andamento'
                      : 'Agendado'}
                  </span>
                </div>

                {selectedEvent.resource.total && (
                  <div>
                    <p className="text-sm text-slate-600">Valor Total:</p>
                    <p className="font-medium text-navy">{formatCurrency(selectedEvent.resource.total)}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <Button
                    variant="primary"
                    onClick={() => {
                      navigate(`/work-orders/${selectedEvent.id}`);
                      setShowEventModal(false);
                    }}
                    className="w-full"
                  >
                    Ver Detalhes Completos
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => {
            const now = new Date();
            const slot: SlotInfo = {
              start: now,
              end: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
              action: 'click',
              slots: [now],
            };
            handleSelectSlot(slot);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-navy text-white rounded-full shadow-lg hover:bg-navy-700 transition-colors flex items-center justify-center z-40"
          aria-label="Novo agendamento"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </Layout>
  );
}
