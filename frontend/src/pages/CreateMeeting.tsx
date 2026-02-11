import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, ArrowLeft, LogOut, Users, FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from '@tanstack/react-query';

interface Booking {
  id: number;
  room: {
    name: string;
    location: string;
  };
  start_time: string;
  end_time: string;
  booking_status: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const CreateMeeting = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [attendees, setAttendees] = useState<number[]>([]);
  const [newAttendee, setNewAttendee] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdMeetingId, setCreatedMeetingId] = useState<number | null>(null);
  const [existingMoM, setExistingMoM] = useState<any>(null);
  const [checkingMoM, setCheckingMoM] = useState(false);

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`http://127.0.0.1:8000/api/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        
        setBooking(response.data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast({
          title: "Error",
          description: "Failed to fetch booking details",
          variant: "destructive"
        });
      }
    };

    fetchBooking();
  }, [bookingId, toast, navigate]);

  // Fetch all users for attendee selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://127.0.0.1:8000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleAddAttendee = () => {
    if (newAttendee.trim()) {
      const selectedUser = users.find(user => 
        user.id.toString() === newAttendee || 
        user.email === newAttendee
      );
      
      if (selectedUser && !attendees.includes(selectedUser.id)) {
        setAttendees([...attendees, selectedUser.id]);
        setNewAttendee("");
      }
    }
  };

  const handleRemoveAttendee = (attendeeId: number) => {
    setAttendees(attendees.filter(id => id !== attendeeId));
  };

  const checkForExistingMoM = async (meetingId: number) => {
    setCheckingMoM(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://127.0.0.1:8000/api/moms?meeting_id=${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.length > 0) {
        setExistingMoM(response.data[0]);
      }
    } catch (error) {
      console.log('No existing MoM found or error fetching MoM');
    } finally {
      setCheckingMoM(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('http://127.0.0.1:8000/api/meetings', {
        booking_id: bookingId,
        title,
        agenda,
        attendees
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const meetingId = response.data.id;
      setCreatedMeetingId(meetingId);
      
      toast({
        title: "Meeting Created Successfully!",
        description: "Your meeting has been created and linked to the room booking.",
      });
      
      // Check for existing MoM
      await checkForExistingMoM(meetingId);
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Meeting Creation Failed",
        description: error.response?.data?.message || "Could not create the meeting",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userProfilePicture');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Invalid Request</CardTitle>
              <CardDescription>No booking information found. Please select a booking from the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-800">Loading Booking Information</CardTitle>
              <CardDescription>Please wait while we fetch your booking details...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm border-sky-200 hover:bg-sky-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-700 to-blue-800 bg-clip-text text-transparent">
                Create Meeting
              </h1>
              <p className="text-sky-600 mt-2">Add meeting details to your room booking</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-sky-600 hover:text-sky-800 hover:bg-sky-100/50"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Meeting Form or Success State */}
          <div className="lg:col-span-2">
            {createdMeetingId ? (
              // Success State
              <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <FileText className="h-5 w-5" />
                    Meeting Created Successfully!
                  </CardTitle>
                  <CardDescription>Your meeting has been created and linked to the room booking.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Meeting Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Title:</span> {title}</p>
                      <p><span className="font-medium">Agenda:</span> {agenda}</p>
                      {attendees.length > 0 && (
                        <p><span className="font-medium">Attendees:</span> {attendees.length} people</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      onClick={() => navigate('/dashboard')}
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Meeting Form
              <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-800">
                    <FileText className="h-5 w-5" />
                    Meeting Details
                  </CardTitle>
                  <CardDescription>Create a meeting for your booked room</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Meeting Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Meeting Title *</Label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Enter meeting title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="border-sky-200 focus:border-sky-400"
                      />
                    </div>

                    {/* Meeting Agenda */}
                    <div className="space-y-2">
                      <Label htmlFor="agenda">Meeting Agenda *</Label>
                      <Textarea
                        id="agenda"
                        placeholder="Enter meeting agenda and objectives"
                        value={agenda}
                        onChange={(e) => setAgenda(e.target.value)}
                        required
                        className="border-sky-200 focus:border-sky-400 min-h-[100px]"
                      />
                    </div>

                    {/* Attendees */}
                    <div className="space-y-2">
                      <Label htmlFor="attendees">Attendees</Label>
                      <div className="flex gap-2">
                        <Select onValueChange={(value) => setNewAttendee(value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select attendee" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={handleAddAttendee}
                          className="bg-sky-500 hover:bg-sky-600"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Attendees List */}
                      {attendees.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {attendees.map((attendeeId) => {
                            const attendee = users.find(u => u.id === attendeeId);
                            return attendee ? (
                              <Badge
                                key={attendeeId}
                                variant="secondary"
                                className="bg-sky-100 text-sky-800 hover:bg-sky-200"
                              >
                                {attendee.name}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttendee(attendeeId)}
                                  className="ml-2 hover:text-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Creating Meeting...
                          </>
                        ) : (
                          "Create Meeting"
                        )}
                      </Button>
                      <Link to="/dashboard">
                        <Button type="button" variant="outline" className="flex-1 border-sky-200 hover:bg-sky-50">
                          Cancel
                        </Button>
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Information */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-800">
                  <Calendar className="h-5 w-5" />
                  Booking Information
                </CardTitle>
                <CardDescription>Room booking details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Room:</span>
                    <span>{booking.room.name}</span>
                  </div>
                  <div className="text-sm text-gray-500 ml-6">
                    {booking.room.location}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(booking.start_time)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Time:</span>
                  <span>
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={booking.booking_status === 'confirmed' 
                    ? "bg-green-100 text-green-800" 
                    : booking.booking_status === 'pending'
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"}>
                    {booking.booking_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Summary */}
            {(title || agenda || attendees.length > 0) && (
              <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-800">
                    <FileText className="h-5 w-5" />
                    Meeting Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {title && (
                    <div>
                      <p className="font-medium">Title:</p>
                      <p className="text-gray-700">{title}</p>
                    </div>
                  )}
                  
                  {agenda && (
                    <div>
                      <p className="font-medium">Agenda:</p>
                      <p className="text-gray-700">
                        {agenda.substring(0, 100)}{agenda.length > 100 ? '...' : ''}
                      </p>
                    </div>
                  )}
                  
                  {attendees.length > 0 && (
                    <div>
                      <p className="font-medium">Attendees ({attendees.length}):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {attendees.map((attendeeId) => {
                          const attendee = users.find(u => u.id === attendeeId);
                          return attendee ? (
                            <Badge key={attendeeId} variant="outline" className="text-xs">
                              {attendee.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMeeting;