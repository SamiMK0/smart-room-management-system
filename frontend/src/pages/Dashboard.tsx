
import { Link, useLocation } from "react-router-dom";
import { Calendar, FileText, Clock, MapPin, BarChart, LogOut, Users, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Mock data for room bookings (without meeting details)
const mockBookings: any[] = [];
const mockMeetings: any[] = [];


interface Attendee {
  id: number;
  meeting_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  name?: string;
  email?: string;
  user?: {
    name: string;
    email: string;
  };
}

interface MoMItem {
  id: string;
  item_type: 'discussion' | 'decision' | 'action_item';
  content: string;
  sequence_order: number;
  assigned_to?: number | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  duration?: string | null;
}

interface SelectedMom {
  decisions: string[];
  actionItems: {
    task: string;
    assignee: string;
    dueDate: string;
    priority: string;
  }[];
  discussions: {
    title: string;
    description: string;
    duration: string;
  }[];
}

const Dashboard = () => {
  // Get stored profile picture and name
  const queryClient = useQueryClient();
  const profilePicture = localStorage.getItem('userProfilePicture') || "/placeholder.svg";
  const userName = localStorage.getItem('userName') || "User";
  const userInitials = userName.split(' ').map(n => n[0]).join('');

  const location = useLocation();
  const [showMomSuccess, setShowMomSuccess] = useState(false);
  const [momMeetingId, setMomMeetingId] = useState<string | null>(null);
  const [momBookingId, setMomBookingId] = useState<string | null>(null);
  const [calculatedAvailability, setCalculatedAvailability] = useState({
    available: 0,
    total: 0
  });

  const [showMomModal, setShowMomModal] = useState(false);
  const [selectedMom, setSelectedMom] = useState<SelectedMom | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');


    // Update the useEffect that handles location.state in Dashboard.tsx
useEffect(() => {
  if (location.state?.momCreated) {
    setShowMomSuccess(true);
    setMomMeetingId(location.state.meetingId);
    setMomBookingId(location.state.bookingId);
    
    // Force a refresh of the bookings data
      queryClient.setQueryData(['user-bookings'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((booking: any) => {
          if (booking.meeting?.id === location.state.meetingId) {
            return {
              ...booking,
              meeting: {
                ...booking.meeting,
                minutes: location.state.minutes
              }
            };
          }
          return booking;
        });
      });
    
    
    // Clear the state after showing the success
    window.history.replaceState({}, document.title);
  }
}, [location.state, queryClient]);


  const [userData, setUserData] = useState({
    name: localStorage.getItem('userName') || "User",
    picture: localStorage.getItem('userProfilePicture') || "/placeholder.svg"
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData({
        name: parsedUser.name || "User",
        picture: parsedUser.picture || "/placeholder.svg"
      });
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      const fetchFreshData = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUserData({
              name: data.name || "User",
              picture: data.picture || "/placeholder.svg"
            });
          }
        } catch (error) {
          console.error('Error fetching fresh user data:', error);
        }
      };
      fetchFreshData();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userProfilePicture');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMeetingForBooking = (bookingId: number) => {
    return mockMeetings.find(meeting => meeting.bookingId === bookingId);
  };

  // Fetch stats using fetch API
  const { data: stats, error: statsError, isLoading: isLoadingStats } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/bookings/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Stats response:', data); // Add this line
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },
  retry: false
});

  // Fetch bookings using fetch API
  const { data: bookings, error: bookingsError, isLoading: isLoadingBookings } = useQuery({
  queryKey: ['user-bookings'],
  queryFn: async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },
  retry: false
});


useEffect(() => {
    if (bookings && stats) {
      const now = new Date();
      const bookedRooms = bookings.filter(booking => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        return start <= now && now <= end;
      }).length;
      
      setCalculatedAvailability({
        available: (stats.total_rooms || stats.totalRooms || 0) - bookedRooms,
        total: stats.total_rooms || stats.totalRooms || 0
      });
    }
  }, [bookings, stats]);

// Add this inside your Dashboard component
useEffect(() => {
  if (statsError) {
    console.error('Stats fetch error:', statsError);
  }
  if (bookingsError) {
    console.error('Bookings fetch error:', bookingsError);
  }
}, [statsError, bookingsError]);

// Update the handleViewMom function in Dashboard.tsx
const handleViewMom = (meeting: any) => {
  if (meeting.mom) {
    setSelectedMom({
      decisions: meeting.mom.items
        .filter((item: any) => item.item_type === 'decision')
        .map((item: any) => item.content),
      actionItems: meeting.mom.items
        .filter((item: any) => item.item_type === 'action_item')
        .map((item: any) => {
          const assignee = meeting.attendees?.find((a: any) => a.user_id === item.assigned_to);
          const assigneeName = assignee?.user?.name || 
                             assignee?.name || 
                             (item.assignee ? item.assignee.name : 'Unassigned');
          
          return {
            task: item.content,
            assignee: assigneeName,
            assigneeId: item.assigned_to,
            dueDate: item.due_date || 'No due date',
            priority: item.priority || 'medium'
          };
        }),
      discussions: meeting.mom.items
        .filter((item: any) => item.item_type === 'discussion')
        .map((item: any) => {
          const [title, ...descParts] = item.content.split(':');
          return {
            title: title.trim(),
            description: descParts.join(':').trim(),
            duration: item.duration || 'N/A'
          };
        })
    });
    setShowMomModal(true);
  }
};

const handleCancelBooking = async (bookingId: number) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://127.0.0.1:8000/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    } else {
      toast.error('Failed to cancel booking');
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    toast.error('Error cancelling booking');
  }
};

const handleRescheduleBooking = (booking: any) => {
  setSelectedBooking(booking);
  setNewStartTime(booking.start_time.slice(0, 16)); // Format for datetime-local input
  setNewEndTime(booking.end_time.slice(0, 16));
  setRescheduleModal(true);
};

const handleSubmitReschedule = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://127.0.0.1:8000/api/bookings/${selectedBooking.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        start_time: newStartTime,
        end_time: newEndTime,
      }),
    });

    if (response.ok) {
      toast.success('Booking rescheduled successfully');
      setRescheduleModal(false);
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    } else {
      toast.error('Failed to reschedule booking');
    }
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    toast.error('Error rescheduling booking');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-sky-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-700 to-blue-800 bg-clip-text text-transparent">
              Smart Meeting Dashboard
            </h1>
            <p className="text-sky-600">Welcome back! Manage your bookings and meetings efficiently.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-sky-600 hover:text-sky-800 hover:bg-sky-100/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Link to="/profile">
              <Avatar className="h-10 w-10 ring-2 ring-sky-200 hover:ring-sky-400 transition-all cursor-pointer">
                <AvatarImage src={userData.picture} onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}/>
                <AvatarFallback className="bg-gradient-to-r from-sky-400 to-blue-500 text-white">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in">
          {/* Quick Stats - Available Rooms Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Available Rooms</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoadingStats || isLoadingBookings ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ) : statsError || bookingsError ? (
                <div className="text-red-500 text-sm">Error loading data</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-700">
                    {calculatedAvailability.available}
                  </div>
                  <p className="text-xs text-green-600">
                    Out of {calculatedAvailability.total} total rooms
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">This Month</CardTitle>
              <BarChart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ) : statsError ? (
                  <div className="text-red-500 text-sm">Error loading data</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-purple-700">{stats?.monthlyBookings || 0}</div>
                    <p className="text-xs text-purple-600">Total bookings</p>
                  </>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Main Action - Book a Room */}
        <div className="mb-8 animate-slide-up">
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sky-800 group-hover:text-sky-900 transition-colors">
                <Calendar className="h-5 w-5" />
                Book Meeting Room
              </CardTitle>
              <CardDescription>Reserve a room for your upcoming meeting</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/book-meeting">
                <Button className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white transform hover:-translate-y-1 transition-all duration-200">
                  Book Room Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* All Bookings */}
        <div className="animate-slide-up">
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sky-800">My Room Bookings</CardTitle>
              <CardDescription>All your room bookings and their associated meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                    {isLoadingBookings ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 bg-sky-50/50 rounded-lg border border-sky-100">
                              <div className="animate-pulse space-y-3">
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div className="h-4 bg-gray-200 rounded"></div>
                                  <div className="h-4 bg-gray-200 rounded"></div>
                                  <div className="h-4 bg-gray-200 rounded"></div>
                                  <div className="h-4 bg-gray-200 rounded"></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : bookingsError ? (
                          <div className="text-center py-8">
                            <div className="text-red-500 mb-4">Failed to load bookings</div>
                            <Button 
                              variant="outline" 
                              onClick={() => window.location.reload()}
                              className="border-sky-200 hover:bg-sky-50"
                            >
                              Retry
                            </Button>
                          </div>
                        ) : bookings && bookings.length > 0 ? (
                              <div className="space-y-4">
                                {bookings.map((booking: any) => {
                                  const meeting = booking.meeting;
                                  const isNewMom = showMomSuccess && momMeetingId === meeting?.id;
                                  return (
                                    <div key={booking.id} className="p-4 bg-sky-50/50 rounded-lg border border-sky-100 hover:shadow-md transition-all">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900">
                                              {meeting ? meeting.title : `Room Booking #${booking.id}`}
                                            </h3>
                                            <Badge className={`text-xs ${getStatusColor(booking.booking_status)}`}>
                                              {booking.booking_status}
                                            </Badge>
                                              {meeting && (
                                                  <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                                    Meeting Created
                                                  </Badge>
                                              )}
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                              <MapPin className="h-4 w-4" />
                                              {booking.room?.name || 'Room not specified'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-4 w-4" />
                                              {new Date(booking.start_time).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Clock className="h-4 w-4" />
                                                {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                                {new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            {meeting && (
                                              <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {meeting.attendees_count || 0} attendees
                                              </div>
                                            )}
                                          </div>
                                            {meeting && meeting.attendees && meeting.attendees.length > 0 && (
                                                  <div className="mt-2">
                                                    <p className="text-sm text-gray-700 mb-1">
                                                      <strong>Agenda:</strong> {meeting.agenda || 'No agenda provided'}
                                                    </p>

                                                    <p className="text-xs text-gray-500 mb-1">Attendees:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                      {meeting.attendees.map((attendee: Attendee, index: number) => {
                                                        const attendeeName = attendee.user?.name || attendee.name || 
                                                                          (attendee.user_id ? `Attendee ${index + 1}` : `External ${index + 1}`);
                                                        return (
                                                          <Badge key={index} variant="outline" className="text-xs">
                                                            {attendeeName}
                                                          </Badge>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                        </div>
                                        <div className="ml-4 flex flex-col gap-2">
                                            {!meeting ? (
                                              <Link to={`/create-meeting?bookingId=${booking.id}&room=${encodeURIComponent(booking.room?.name || '')}&date=${new Date(booking.start_time).toISOString().split('T')[0]}&startTime=${new Date(booking.start_time).toISOString()}&endTime=${new Date(booking.end_time).toISOString()}`}>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                                                >
                                                  <Plus className="h-4 w-4 mr-1" />
                                                  Create Meeting
                                                </Button>
                                              </Link>
                                            ) : (
                                              <>
                                                {meeting.mom && meeting.mom.items && meeting.mom.items.length > 0 ? (
                                                  <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                                                    onClick={() => handleViewMom(meeting)}
                                                  >
                                                    <FileText className="h-4 w-4 mr-1" />
                                                    View MoM
                                                  </Button>
                                                ) : (
                                                  <Link to={`/minutes?meetingId=${meeting.id}&bookingId=${booking.id}`}>
                                                    <Button 
                                                      size="sm" 
                                                      variant="outline"
                                                      className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800"
                                                    >
                                                      <FileText className="h-4 w-4 mr-1" />
                                                      Add Minutes
                                                    </Button>
                                                  </Link>
                                                )}
                                              </>
                                            )}
                                            
                                            {/* Booking Management Options */}
                                            <div className="flex gap-2 mt-2">
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                                                onClick={() => handleCancelBooking(booking.id)}
                                              >
                                                Cancel
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:text-orange-800"
                                                onClick={() => handleRescheduleBooking(booking)}
                                              >
                                                Reschedule
                                              </Button>
                                            </div>
                                          </div>
                                      </div>
                                    </div>
                                  );
                                })}
                        </div>
                        ) : (  
                              <div className="text-center py-8 text-gray-500">
                                  You don't have any bookings yet
                                  <div className="mt-4">
                                    <Link to="/book-meeting">
                                      <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white">
                                        Book Your First Room
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                            )}
                            </div>
                      </CardContent>
                    </Card>
                  </div>
              </div>

              {showMomModal && selectedMom && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h2 className="text-2xl font-bold text-gray-900">Meeting Minutes</h2>
                          <button 
                            onClick={() => setShowMomModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                        
                        <div className="space-y-6">
                          {/* Discussion Items Section */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Discussion Items</h3>
                            <div className="mt-2 space-y-3">
                              {selectedMom.discussions?.length > 0 ? (
                                selectedMom.discussions.map((discussion: any, index: number) => (
                                  <div key={index} className="bg-gray-50 p-4 rounded border-l-4 border-sky-500">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium">{discussion.title}</p>
                                        {discussion.description && (
                                          <p className="text-sm text-gray-600 mt-1">{discussion.description}</p>
                                        )}
                                      </div>
                                      {discussion.duration && (
                                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {discussion.duration} min
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">No discussion items</p>
                              )}
                            </div>
                          </div>

                          {/* Existing Decisions Section */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Decisions</h3>
                            <div className="mt-2 bg-gray-50 p-4 rounded">
                              {selectedMom.decisions?.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-2">
                                  {selectedMom.decisions.map((decision: string, index: number) => (
                                    <li key={index} className="text-gray-700">{decision}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500">No decisions recorded</p>
                              )}
                            </div>
                          </div>

                          
                          {/* Existing Action Items Section */}
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">Action Items</h3>
                              <div className="mt-2 space-y-3">
                                {selectedMom.actionItems?.length > 0 ? (
                                  selectedMom.actionItems.map((item: any, index: number) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium">{item.task}</p>
                                          <p className="text-sm text-gray-600">Assigned to: {item.assignee}</p>
                                          <p className="text-sm text-gray-500">Due: {item.dueDate}</p>
                                        </div>
                                        <Badge 
                                          variant="outline" 
                                          className={`ml-2 ${
                                            item.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                            'bg-green-100 text-green-800 border-green-200'
                                          }`}
                                        >
                                          {item.priority}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500">No action items</p>
                                )}
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reschedule Modal */}
                <Dialog open={rescheduleModal} onOpenChange={setRescheduleModal}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reschedule Booking</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="start-time">Start Time</Label>
                        <Input
                          id="start-time"
                          type="datetime-local"
                          value={newStartTime}
                          onChange={(e) => setNewStartTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-time">End Time</Label>
                        <Input
                          id="end-time"
                          type="datetime-local"
                          value={newEndTime}
                          onChange={(e) => setNewEndTime(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setRescheduleModal(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSubmitReschedule}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
            </div>
            );
          };

export default Dashboard;
