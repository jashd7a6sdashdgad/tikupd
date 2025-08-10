'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { ModernCard } from '@/components/ui/ModernCard';
import {
  Settings,
  Plus,
  Trash2,
  Move,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  DollarSign,
  BarChart3,
  Users,
  BookOpen,
  Facebook,
  Youtube,
  MessageSquare,
  ShoppingBag,
  Camera,
  Phone,
  Sun,
  MapPin,
  Briefcase,
  Search,
  Home,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Star,
  Activity,
  PieChart,
  Timer,
  Award,
  Bookmark
} from 'lucide-react';

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  visible: boolean;
  data?: any;
  config?: any;
}

interface WidgetType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: 'small' | 'medium' | 'large';
  component: React.ComponentType<any>;
}

// Sample Widget Components
const CalendarWidget = ({ widget }: { widget: Widget }) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <Calendar className="h-5 w-5 text-blue-600" />
      <h3 className="font-semibold text-gray-800">{widget.title}</h3>
    </div>
    <div className="space-y-2">
      <div className="p-2 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-blue-800">Team Meeting</p>
        <p className="text-xs text-blue-600">Today at 2:00 PM</p>
      </div>
      <div className="p-2 bg-green-50 rounded-lg">
        <p className="text-sm font-medium text-green-800">Project Review</p>
        <p className="text-xs text-green-600">Tomorrow at 10:00 AM</p>
      </div>
    </div>
  </div>
);

const ExpensesWidget = ({ widget }: { widget: Widget }) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <DollarSign className="h-5 w-5 text-green-600" />
      <h3 className="font-semibold text-gray-800">{widget.title}</h3>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">This Month</span>
        <span className="font-bold text-green-600">$2,340</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Last Month</span>
        <span className="font-medium text-gray-800">$2,180</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-green-500 h-2 rounded-full" style={{ width: '73%' }}></div>
      </div>
    </div>
  </div>
);

const AnalyticsWidget = ({ widget }: { widget: Widget }) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <BarChart3 className="h-5 w-5 text-purple-600" />
      <h3 className="font-semibold text-gray-800">{widget.title}</h3>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <p className="text-2xl font-bold text-purple-600">156</p>
        <p className="text-xs text-gray-600">Events</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-600">89</p>
        <p className="text-xs text-gray-600">Emails</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-green-600">23</p>
        <p className="text-xs text-gray-600">Contacts</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-orange-600">94%</p>
        <p className="text-xs text-gray-600">Efficiency</p>
      </div>
    </div>
  </div>
);

const WeatherWidget = ({ widget }: { widget: Widget }) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <Sun className="h-5 w-5 text-yellow-600" />
      <h3 className="font-semibold text-gray-800">{widget.title}</h3>
    </div>
    <div className="text-center">
      <div className="text-4xl font-bold text-yellow-600 mb-2">28°C</div>
      <p className="text-sm text-gray-600 mb-2">Sunny</p>
      <div className="flex justify-between text-xs text-gray-500">
        <span>High: 32°C</span>
        <span>Low: 24°C</span>
      </div>
    </div>
  </div>
);

const TasksWidget = ({ widget }: { widget: Widget }) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <Target className="h-5 w-5 text-red-600" />
      <h3 className="font-semibold text-gray-800">{widget.title}</h3>
    </div>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm text-gray-800">Review project proposal</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" className="rounded" defaultChecked />
        <span className="text-sm text-gray-500 line-through">Send weekly report</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm text-gray-800">Plan team meeting</span>
      </div>
    </div>
  </div>
);

const QuickStatsWidget = ({ widget }: { widget: Widget }) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <Activity className="h-5 w-5 text-indigo-600" />
      <h3 className="font-semibold text-gray-800">{widget.title}</h3>
    </div>
    <div className="grid grid-cols-1 gap-2">
      <div className="flex justify-between items-center p-2 bg-indigo-50 rounded-lg">
        <span className="text-sm text-indigo-800">Productivity</span>
        <span className="font-bold text-indigo-600">87%</span>
      </div>
      <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
        <span className="text-sm text-green-800">Efficiency</span>
        <span className="font-bold text-green-600">92%</span>
      </div>
    </div>
  </div>
);

// Widget types registry
const WIDGET_TYPES: WidgetType[] = [
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Upcoming events and appointments',
    icon: <Calendar className="h-5 w-5" />,
    defaultSize: 'medium',
    component: CalendarWidget
  },
  {
    id: 'expenses',
    name: 'Expenses',
    description: 'Financial overview and spending',
    icon: <DollarSign className="h-5 w-5" />,
    defaultSize: 'medium',
    component: ExpensesWidget
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Performance metrics and insights',
    icon: <BarChart3 className="h-5 w-5" />,
    defaultSize: 'large',
    component: AnalyticsWidget
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Current weather and forecast',
    icon: <Sun className="h-5 w-5" />,
    defaultSize: 'small',
    component: WeatherWidget
  },
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'Todo list and task management',
    icon: <Target className="h-5 w-5" />,
    defaultSize: 'medium',
    component: TasksWidget
  },
  {
    id: 'quickstats',
    name: 'Quick Stats',
    description: 'Key performance indicators',
    icon: <Activity className="h-5 w-5" />,
    defaultSize: 'small',
    component: QuickStatsWidget
  }
];

interface CustomizableWidgetsProps {
  className?: string;
}

export const CustomizableWidgets: React.FC<CustomizableWidgetsProps> = ({
  className = ''
}) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  // Load widgets from localStorage
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (error) {
        console.error('Error loading widgets:', error);
        loadDefaultWidgets();
      }
    } else {
      loadDefaultWidgets();
    }
  }, []);

  // Save widgets to localStorage
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
    }
  }, [widgets]);

  const loadDefaultWidgets = () => {
    const defaultWidgets: Widget[] = [
      {
        id: 'calendar-1',
        type: 'calendar',
        title: 'Upcoming Events',
        size: 'medium',
        position: { x: 0, y: 0 },
        visible: true
      },
      {
        id: 'expenses-1',
        type: 'expenses',
        title: 'Monthly Expenses',
        size: 'medium',
        position: { x: 1, y: 0 },
        visible: true
      },
      {
        id: 'analytics-1',
        type: 'analytics',
        title: 'Analytics Overview',
        size: 'large',
        position: { x: 0, y: 1 },
        visible: true
      },
      {
        id: 'weather-1',
        type: 'weather',
        title: 'Weather',
        size: 'small',
        position: { x: 2, y: 0 },
        visible: true
      }
    ];
    setWidgets(defaultWidgets);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
  };

  const addWidget = (typeId: string) => {
    const widgetType = WIDGET_TYPES.find(t => t.id === typeId);
    if (!widgetType) return;

    const newWidget: Widget = {
      id: `${typeId}-${Date.now()}`,
      type: typeId,
      title: widgetType.name,
      size: widgetType.defaultSize,
      position: { x: widgets.length % 3, y: Math.floor(widgets.length / 3) },
      visible: true
    };

    setWidgets([...widgets, newWidget]);
    setShowAddWidget(false);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
  };

  const getWidgetComponent = (widget: Widget) => {
    const widgetType = WIDGET_TYPES.find(t => t.id === widget.type);
    if (!widgetType) return null;

    const Component = widgetType.component;
    return <Component widget={widget} />;
  };

  const getWidgetSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1';
      case 'medium': return 'col-span-1 md:col-span-2 row-span-2';
      case 'large': return 'col-span-1 md:col-span-3 row-span-3';
      default: return 'col-span-1 row-span-1';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Control Panel */}
      <ModernCard gradient="blue" blur="lg" className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard Widgets</h2>
              <p className="text-gray-600">Customize your dashboard layout</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddWidget(!showAddWidget)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              variant={isEditMode ? "destructive" : "outline"}
            >
              {isEditMode ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Exit Edit
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Mode
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Add Widget Panel */}
        {showAddWidget && (
          <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Available Widgets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WIDGET_TYPES.map(widgetType => (
                <div
                  key={widgetType.id}
                  className="p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer transition-colors"
                  onClick={() => addWidget(widgetType.id)}
                >
                  <div className="flex items-center gap-3">
                    {widgetType.icon}
                    <div>
                      <h4 className="font-medium text-gray-800">{widgetType.name}</h4>
                      <p className="text-sm text-gray-600">{widgetType.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModernCard>

      {/* Widgets Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min"
            >
              {widgets
                .filter(widget => widget.visible)
                .map((widget, index) => (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                    isDragDisabled={!isEditMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${getWidgetSizeClass(widget.size)} ${
                          snapshot.isDragging ? 'opacity-75' : ''
                        }`}
                      >
                        <ModernCard
                          gradient="none"
                          blur="lg"
                          className={`h-full relative group ${
                            isEditMode ? 'ring-2 ring-blue-300' : ''
                          } hover:shadow-xl transition-all duration-300`}
                        >
                          {/* Edit Mode Controls */}
                          {isEditMode && (
                            <div className="absolute top-2 right-2 flex gap-2 z-10">
                              <div
                                {...provided.dragHandleProps}
                                className="p-1 bg-white/90 hover:bg-white rounded cursor-move shadow-sm"
                              >
                                <Move className="h-4 w-4 text-gray-600" />
                              </div>
                              <button
                                onClick={() => toggleWidgetVisibility(widget.id)}
                                className="p-1 bg-white/90 hover:bg-white rounded shadow-sm"
                              >
                                {widget.visible ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                              <button
                                onClick={() => removeWidget(widget.id)}
                                className="p-1 bg-white/90 hover:bg-white rounded shadow-sm"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          )}

                          {/* Widget Content */}
                          {getWidgetComponent(widget)}
                        </ModernCard>
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Hidden Widgets */}
      {widgets.some(w => !w.visible) && (
        <ModernCard gradient="none" blur="lg" className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Hidden Widgets</h3>
          <div className="flex flex-wrap gap-2">
            {widgets
              .filter(w => !w.visible)
              .map(widget => (
                <button
                  key={widget.id}
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  <EyeOff className="h-4 w-4 inline mr-2" />
                  {widget.title}
                </button>
              ))}
          </div>
        </ModernCard>
      )}
    </div>
  );
};

export default CustomizableWidgets;