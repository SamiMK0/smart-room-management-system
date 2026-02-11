
import { useState, useEffect } from "react";
import { Calendar, Check, X, Edit3, Trash2, Clock, Users, MapPin, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Booking {
  id: number;
  user: {
    name: string;
    email: string;
  };
  room: {
    name: string;
    location: string;
  };
  start_time: string;
  end_time: string;
  booking_status: 'pending' | 'confirmed' | 'cancelled';
  purpose?: string;
}

const BookingManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteBookingId, setDeleteBookingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    start_time: "",
    end_time: "",
    booking_status: "pending"
  });

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://127.0.0.1:8000/api/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };


  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormData({
      start_time: booking.start_time,
      end_time: booking.end_time,
      booking_status: booking.booking_status
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://127.0.0.1:8000/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      setBookings(bookings.filter(booking => booking.id !== bookingId));
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      });
    } finally {
      setDeleteBookingId(null);
    }
  };

  const handleSaveBooking = async () => {
    if (!selectedBooking) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://127.0.0.1:8000/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking');
      }

      const updatedBooking = await response.json();
      setBookings(bookings.map(booking => 
        booking.id === selectedBooking.id ? updatedBooking : booking
      ));
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('userProfilePicture');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  const pendingCount = bookings.filter(b => b.booking_status === "pending").length;
  const confirmedCount = bookings.filter(b => b.booking_status === "confirmed").length;
  const totalBookings = bookings.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/admin")}
              className="bg-white/80 backdrop-blur-sm border-sky-200 hover:bg-sky-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-700 to-blue-800 bg-clip-text text-transparent">
                Booking Management
              </h1>
              <p className="text-sky-600 mt-2">Manage all room bookings and approvals</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sky-800">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-700">{totalBookings}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-yellow-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Confirmed</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{confirmedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-800">
              <Calendar className="h-5 w-5" />
              All Bookings
            </CardTitle>
            <CardDescription>Manage and approve room bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Booked By</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const startDateTime = formatDateTime(booking.start_time);
                    const endDateTime = formatDateTime(booking.end_time);
                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-sky-600" />
                            <div>
                              <div>{booking.room.name}</div>
                              <div className="text-xs text-gray-500">{booking.room.location}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{booking.user.name}</div>
                            <div className="text-xs text-gray-500">{booking.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{startDateTime.date}</div>
                            <div className="text-gray-500">
                              {startDateTime.time} - {endDateTime.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.booking_status)}>
                            {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBooking(booking)}
                              title="Edit Booking"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteBookingId(booking.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Booking Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>Update booking details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="start_time">Start Date & Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time ? new Date(formData.start_time).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({...formData, start_time: new Date(e.target.value).toISOString()})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Date & Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time ? new Date(formData.end_time).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({...formData, end_time: new Date(e.target.value).toISOString()})}
                  />
                </div>
                <div>
                  <Label htmlFor="booking_status">Status</Label>
                  <Select value={formData.booking_status} onValueChange={(value) => setFormData({...formData, booking_status: value as 'pending' | 'confirmed' | 'cancelled'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveBooking}>Update Booking</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteBookingId !== null} onOpenChange={() => setDeleteBookingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this booking? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteBookingId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteBookingId && handleDeleteBooking(deleteBookingId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BookingManagement;
