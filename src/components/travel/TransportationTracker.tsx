'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plane,
  Train,
  Bus,
  Car,
  Ship,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Bell,
  Plus,
  Edit,
  Trash2,
  Navigation,
  Calendar,
  DollarSign,
  Ticket,
  User,
  Wifi,
  Coffee,
  Utensils
} from 'lucide-react';

interface Transportation {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'car' | 'ship';
  from: string;
  to: string;
  departure: Date;
  arrival: Date;
  provider: string;
  bookingReference: string;
  cost: number;
  currency: string;
  status: 'booked' | 'checked-in' | 'boarding' | 'delayed' | 'cancelled' | 'in-transit' | 'arrived' | 'completed';
  gate?: string;
  terminal?: string;
  seat?: string;
  trackingUrl?: string;
  delay?: number; // in minutes
  actualDeparture?: Date;
  actualArrival?: Date;
  amenities?: string[];
  notes?: string;
}

interface FlightStatus {
  flightNumber: string;
  status: 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived';
  delay?: number;
  gate?: string;
  terminal?: string;
  baggage?: string;
}

const transportIcons = {
  flight: Plane,
  train: Train,
  bus: Bus,
  car: Car,
  ship: Ship
};

const statusColors = {
  booked: 'bg-blue-100 text-blue-800 border-blue-200',
  'checked-in': 'bg-green-100 text-green-800 border-green-200',
  boarding: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  delayed: 'bg-orange-100 text-orange-800 border-orange-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  'in-transit': 'bg-purple-100 text-purple-800 border-purple-200',
  arrived: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const amenityIcons = {
  wifi: Wifi,
  food: Utensils,
  drinks: Coffee
};

interface TransportationTrackerProps {
  itineraryId?: string;
}

export function TransportationTracker({ itineraryId }: TransportationTrackerProps) {
  const [transports, setTransports] = useState<Transportation[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<Transportation | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Sample data
    const sampleTransports: Transportation[] = [
      {
        id: '1',
        type: 'flight',
        from: 'Muscat (MCT)',
        to: 'Dubai (DXB)',
        departure: new Date('2024-12-15T08:00:00'),
        arrival: new Date('2024-12-15T09:30:00'),
        provider: 'Emirates',
        bookingReference: 'EK123456',
        cost: 300,
        currency: 'OMR',
        status: 'booked',
        gate: '12',
        terminal: 'T3',
        seat: '12A',
        amenities: ['wifi', 'food', 'drinks'],
        notes: 'Window seat requested'
      },
      {
        id: '2',
        type: 'train',
        from: 'Dubai Marina',
        to: 'Abu Dhabi',
        departure: new Date('2024-12-16T14:00:00'),
        arrival: new Date('2024-12-16T16:30:00'),
        provider: 'Etihad Rail',
        bookingReference: 'ER789012',
        cost: 45,
        currency: 'AED',
        status: 'booked',
        seat: 'Coach A, Seat 15',
        amenities: ['wifi']
      },
      {
        id: '3',
        type: 'flight',
        from: 'Dubai (DXB)',
        to: 'Muscat (MCT)',
        departure: new Date('2024-12-20T18:00:00'),
        arrival: new Date('2024-12-20T19:30:00'),
        provider: 'Oman Air',
        bookingReference: 'WY345678',
        cost: 280,
        currency: 'OMR',
        status: 'delayed',
        delay: 45,
        gate: '8',
        terminal: 'T1',
        seat: '8F',
        amenities: ['wifi', 'food']
      }
    ];

    setTransports(sampleTransports);
  }, [itineraryId]);

  // Simulate live updates
  useEffect(() => {
    if (!liveUpdates) return;

    const interval = setInterval(() => {
      setTransports(prev => prev.map(transport => {
        // Simulate status updates
        if (transport.status === 'booked' && Math.random() > 0.8) {
          return { ...transport, status: 'checked-in' as const };
        }
        if (transport.status === 'checked-in' && Math.random() > 0.9) {
          return { ...transport, status: 'boarding' as const };
        }
        return transport;
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [liveUpdates]);

  const filteredTransports = transports.filter(transport => 
    transport.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transport.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transport.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transport.bookingReference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked': return Info;
      case 'checked-in': return CheckCircle;
      case 'boarding': return Bell;
      case 'delayed': case 'cancelled': return AlertCircle;
      case 'in-transit': return Navigation;
      case 'arrived': case 'completed': return CheckCircle;
      default: return Info;
    }
  };

  const formatDuration = (departure: Date, arrival: Date): string => {
    const diff = arrival.getTime() - departure.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleCheckIn = (transportId: string) => {
    setTransports(prev => prev.map(transport => 
      transport.id === transportId 
        ? { ...transport, status: 'checked-in' as const }
        : transport
    ));
  };

  const refreshStatus = async (transportId: string) => {
    // Simulate API call to get real-time status
    const transport = transports.find(t => t.id === transportId);
    if (transport) {
      // Mock status update
      const statuses = ['on-time', 'delayed', 'boarding'] as const;
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      setTransports(prev => prev.map(t => 
        t.id === transportId 
          ? { ...t, status: randomStatus === 'delayed' ? 'delayed' : t.status }
          : t
      ));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by route, provider, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/70 border-2 border-white/30"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setLiveUpdates(!liveUpdates)}
            className={`${liveUpdates ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50'}`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${liveUpdates ? 'animate-spin' : ''}`} />
            Live Updates
          </Button>
          
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transport
          </Button>
        </div>
      </div>

      {/* Transportation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTransports.map((transport) => {
          const TransportIcon = transportIcons[transport.type];
          const StatusIcon = getStatusIcon(transport.status);
          
          return (
            <Card key={transport.id} className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                      <TransportIcon className="h-6 w-6 text-black font-bold" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-800">
                        {transport.from.split('(')[0].trim()} → {transport.to.split('(')[0].trim()}
                      </CardTitle>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        {transport.provider} • {transport.bookingReference}
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className={statusColors[transport.status]}>
                    {transport.status.replace('-', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Flight/Transport Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Departure</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {transport.departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transport.departure.toLocaleDateString()}
                      </p>
                      {transport.gate && (
                        <p className="text-xs text-blue-600">Gate {transport.gate}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Arrival</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {transport.arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transport.arrival.toLocaleDateString()}
                      </p>
                      {transport.terminal && (
                        <p className="text-xs text-green-600">Terminal {transport.terminal}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Duration and Cost */}
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-bold text-gray-800">{formatDuration(transport.departure, transport.arrival)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Cost</p>
                    <p className="font-bold text-gray-800">{transport.cost} {transport.currency}</p>
                  </div>
                  {transport.seat && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Seat</p>
                      <p className="font-bold text-gray-800">{transport.seat}</p>
                    </div>
                  )}
                </div>

                {/* Delay Warning */}
                {transport.status === 'delayed' && transport.delay && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-800">Delayed by {transport.delay} minutes</p>
                      <p className="text-sm text-orange-700">New departure time estimated</p>
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {transport.amenities && transport.amenities.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Amenities:</span>
                    <div className="flex gap-2">
                      {transport.amenities.map((amenity) => {
                        const AmenityIcon = amenityIcons[amenity as keyof typeof amenityIcons];
                        return AmenityIcon ? (
                          <div key={amenity} className="p-1 bg-blue-100 rounded-lg" title={amenity}>
                            <AmenityIcon className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {transport.status === 'booked' && (
                    <Button
                      onClick={() => handleCheckIn(transport.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Check In
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => refreshStatus(transport.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  
                  <Button
                    onClick={() => setSelectedTransport(transport)}
                    variant="outline"
                    size="sm"
                    className="bg-gray-50 hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {/* Notes */}
                {transport.notes && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> {transport.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTransports.length === 0 && (
        <Card className="bg-white/70 backdrop-blur-xl border-2 border-white/30 rounded-3xl shadow-xl">
          <CardContent className="text-center py-12">
            <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">No Transportation Found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No transportation matches your search.' : 'Add your first transportation booking.'}
            </p>
            <Button
              onClick={() => setIsAddingNew(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-black font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transportation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}