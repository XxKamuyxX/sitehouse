import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { useState, useEffect } from 'react';
import { getDocs } from 'firebase/firestore';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { queryWithCompanyId } from '../lib/queries';

const localizer = momentLocalizer(moment);

interface WorkOrder {
  id: string;
  quoteId: string;
  clientName: string;
  scheduledDate: string;
  technician: string;
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

export function Calendar() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (companyId) {
    loadWorkOrders();
    }
  }, [companyId]);

  const loadWorkOrders = async () => {
    if (!companyId) return;
    
    try {
      // CRITICAL: Use queryWithCompanyId to filter by companyId
      const q = queryWithCompanyId('workOrders', companyId);
      const snapshot = await getDocs(q);
      const workOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WorkOrder[];

      const calendarEvents: CalendarEvent[] = workOrders
        .filter((wo) => wo.scheduledDate)
        .map((wo) => {
          const start = new Date(wo.scheduledDate);
          const end = new Date(start);
          end.setHours(end.getHours() + 2); // Default 2 hour duration

          return {
            id: wo.id,
            title: wo.clientName,
            start,
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
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#3174ad';
    
    if (status === 'completed') {
      backgroundColor = '#28a745';
    } else if (status === 'in-progress') {
      backgroundColor = '#ffc107';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Agenda</h1>
          <p className="text-slate-600 mt-1">Visualize todas as ordens de serviço agendadas</p>
        </div>

        <Card className="p-0 overflow-hidden">
          <div style={{ height: '600px' }}>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              messages={{
                next: 'Próximo',
                previous: 'Anterior',
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                agenda: 'Agenda',
                date: 'Data',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'Não há eventos neste período',
              }}
            />
          </div>
        </Card>

        {/* Event Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">Detalhes do Serviço</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
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
                  <p className="text-sm text-slate-600">Técnico:</p>
                  <p className="font-medium text-navy">
                    {selectedEvent.resource.technician || 'Não atribuído'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Status:</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.resource.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : selectedEvent.resource.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-700'
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

                {selectedEvent.resource.items && selectedEvent.resource.items.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Serviços:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedEvent.resource.items.map((item: any, index: number) => (
                        <li key={index} className="text-sm text-slate-700">
                          {item.serviceName} - {item.quantity}x
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

