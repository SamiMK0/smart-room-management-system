
import { useState } from "react";
import { Calendar, Clock, MapPin, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
}

const MeetingRoomBooking = () => {
  const [selectedRoom, setSelectedRoom] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: rooms = [], isLoading: isLoadingRooms, error: roomsError } = useQuery<Room[]>({
    queryKey: ['available-rooms'],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/rooms/available', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Session expired. Please login again.');
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch rooms: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error;
      }
    },
    retry: false,
  });

  // Handle error using useEffect instead of onError
  useState(() => {
    if (roomsError) {
      toast({
        title: "Error loading rooms",
        description: roomsError.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Basic validation
  if (!selectedRoom || !date || !startTime || !endTime) {
    toast({
      title: "Missing Information",
      description: "Please fill in all required fields",
      variant: "destructive"
    });
    return;
  }

  // Validate time sequence
  if (startTime >= endTime) {
    toast({
      title: "Invalid Time Range",
      description: "End time must be after start time",
      variant: "destructive"
    });
    return;
  }

  setIsLoading(true);

  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Format the date/time for the API
    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    const response = await fetch('http://127.0.0.1:8000/api/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        room_id: parseInt(selectedRoom), // Ensure room_id is a number
        start_time: startDateTime,
        end_time: endDateTime,
        booking_status: 'pending'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 
        errorData.errors?.join(', ') || 
        'Could not book the room'
      );
    }

    const data = await response.json();

    toast({
      title: "Room Booking Successful!",
      description: "Your room has been booked. You can now create a meeting for this booking.",
    });
    
    // Reset form
    setDate("");
    setStartTime("");
    setEndTime("");
    setSelectedRoom("");
    
    // Redirect to dashboard
    navigate('/dashboard');
    
  } catch (error: any) {
    toast({
      title: "Booking Failed",
      description: error.message || "Could not book the room",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('userProfilePicture');
    localStorage.removeItem('userName');
    window.location.href = '/';
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
                Book Meeting Room
              </h1>
              <p className="text-sky-600 mt-2">Reserve a room for your meeting</p>
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
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-800">
                  <Calendar className="h-5 w-5" />
                  Room Booking Details
                </CardTitle>
                <CardDescription>Reserve a room for your meeting</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Room Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="room">Room *</Label>
                    <Select 
                      value={selectedRoom} 
                      onValueChange={setSelectedRoom} 
                      required
                      disabled={isLoadingRooms}
                    >
                      <SelectTrigger className="border-sky-200 focus:border-sky-400">
                        <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select a room"}>
                          {selectedRoom && Array.isArray(rooms) && rooms.find(r => r.id.toString() === selectedRoom) && (
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{rooms.find(r => r.id.toString() === selectedRoom)?.name}</span>
                              <span className="text-sm text-gray-500">
                                {rooms.find(r => r.id.toString() === selectedRoom)?.location} • {rooms.find(r => r.id.toString() === selectedRoom)?.capacity} people
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(rooms) && rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{room.name}</span>
                              <span className="text-sm text-gray-500">{room.location}</span>
                              <span className="text-sm text-gray-500">Capacity: {room.capacity} people</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="border-sky-200 focus:border-sky-400"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="border-sky-200 focus:border-sky-400"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className="border-sky-200 focus:border-sky-400"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                      disabled={isLoading || isLoadingRooms || !selectedRoom || !date || !startTime || !endTime}
                    >
                      {isLoading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Booking Room...
                        </>
                      ) : (
                        "Book Room"
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 border-sky-200 hover:bg-sky-50"
                      disabled={isLoading}
                      onClick={() => {
                        setSelectedRoom("");
                        setDate("");
                        setStartTime("");
                        setEndTime("");
                      }}
                    >
                      Clear Form
                    </Button>
                  </div>

                  
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Room Availability Preview */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-800">
                  <MapPin className="h-5 w-5" />
                  Available Rooms
                </CardTitle>
                <CardDescription>Current meeting rooms</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRooms ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 border rounded-lg border-sky-100 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : !Array.isArray(rooms) || rooms.length === 0 ? (
                  <p className="text-gray-500">No rooms available</p>
                ) : (
                  <div className="space-y-3">
                    {rooms.map((room) => (
                      <div 
                        key={room.id} 
                        className={`p-3 border rounded-lg transition-all duration-200 cursor-pointer ${
                          selectedRoom === room.id.toString() 
                            ? "border-sky-500 bg-sky-50" 
                            : "border-sky-100 hover:border-sky-300"
                        }`}
                        onClick={() => setSelectedRoom(room.id.toString())}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{room.name}</h4>
                            <p className="text-sm text-gray-500">{room.location}</p>
                            <p className="text-sm text-gray-500">Capacity: {room.capacity} people</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Summary */}
            {(selectedRoom || date) && (
              <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-800">
                    <Clock className="h-5 w-5" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedRoom && Array.isArray(rooms) && (
                    <p><strong>Room:</strong> {rooms.find(r => r.id.toString() === selectedRoom)?.name}</p>
                  )}
                  {date && <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>}
                  {startTime && <p><strong>Start Time:</strong> {startTime}</p>}
                  {endTime && <p><strong>End Time:</strong> {endTime}</p>}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Next Step:</strong> After booking the room, you can create a meeting with title, agenda, and attendees.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoomBooking;
