import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Settings, BarChart3, Users, MapPin, Mic, Monitor, Wifi, Coffee, Camera, Printer, Speaker, LogOut, Calendar, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Available features with icons (kept for icon mapping)
const availableFeatures = [
  { id: "mic", name: "Microphone", icon: Mic },
  { id: "projector", name: "Projector", icon: Monitor },
  { id: "wifi", name: "WiFi", icon: Wifi },
  { id: "coffee", name: "Coffee Machine", icon: Coffee },
  { id: "camera", name: "Video Camera", icon: Camera },
  { id: "printer", name: "Printer", icon: Printer },
  { id: "speaker", name: "Speaker System", icon: Speaker }
];

const AdminPanel = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [features, setFeatures] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [featureFormData, setFeatureFormData] = useState({ name: "" });
  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    location: "",
    features: []
  });

  // Fetch features from API
  const fetchFeatures = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/api/features', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch features');
      }

      setFeatures(data);
    } catch (error) {
      console.error('Error fetching features:', error);
      toast.error("Failed to fetch features.");
    }
  };

  // Fetch rooms from API
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/api/rooms', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch rooms');
      }

      // Fetch features for each room
      const roomsWithFeatures = await Promise.all(
        data.map(async (room) => {
          try {
            const featuresResponse = await fetch(`http://127.0.0.1:8000/api/rooms/${room.id}/features`, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (featuresResponse.ok) {
              const roomFeatures = await featuresResponse.json();
              return { ...room, roomFeatures };
            }
            return { ...room, roomFeatures: [] };
          } catch (error) {
            console.error(`Error fetching features for room ${room.id}:`, error);
            return { ...room, roomFeatures: [] };
          }
        })
      );

      setRooms(roomsWithFeatures);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error("Failed to fetch rooms.");
    }
  };

  // Add new feature
  const handleAddFeature = async () => {
    if (!featureFormData.name.trim()) {
      toast.error("Feature name is required");
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: featureFormData.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add feature');
      }

      toast.success("Feature added successfully!");
      setIsFeatureDialogOpen(false);
      setFeatureFormData({ name: "" });
      fetchFeatures();
    } catch (error) {
      console.error('Add feature error:', error);
      toast.error(error.message || "Failed to add feature.");
    }
  };

  // Update feature
  const handleUpdateFeature = async () => {
    if (!featureFormData.name.trim()) {
      toast.error("Feature name is required");
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://127.0.0.1:8000/api/features/${selectedFeature.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: featureFormData.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update feature');
      }

      toast.success("Feature updated successfully!");
      setIsFeatureDialogOpen(false);
      setSelectedFeature(null);
      setFeatureFormData({ name: "" });
      fetchFeatures();
    } catch (error) {
      console.error('Update feature error:', error);
      toast.error(error.message || "Failed to update feature.");
    }
  };

  // Delete feature
  const handleDeleteFeature = async (featureId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://127.0.0.1:8000/api/features/${featureId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete feature');
      }

      toast.success("Feature deleted successfully!");
      fetchFeatures();
    } catch (error) {
      console.error('Delete feature error:', error);
      toast.error(error.message || "Failed to delete feature.");
    }
  };

  const handleEditFeature = (feature) => {
    setSelectedFeature(feature);
    setFeatureFormData({ name: feature.name });
    setIsFeatureDialogOpen(true);
  };

  const handleAddNewFeature = () => {
    setSelectedFeature(null);
    setFeatureFormData({ name: "" });
    setIsFeatureDialogOpen(true);
  };

  const handleSaveFeature = () => {
    if (selectedFeature) {
      handleUpdateFeature();
    } else {
      handleAddFeature();
    }
  };

  // Add new room
  const handleAddRoom = async () => {
    if (!formData.name.trim() || !formData.capacity.trim() || !formData.location.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          capacity: parseInt(formData.capacity),
          location: formData.location,
          features: formData.features
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add room');
      }

      toast.success("Room added successfully!");
      setIsEditDialogOpen(false);
      setFormData({
        name: "",
        capacity: "",
        location: "",
        features: []
      });
      fetchRooms();
    } catch (error) {
      console.error('Add room error:', error);
      toast.error(error.message || "Failed to add room.");
    }
  };

  // Update room
  const handleUpdateRoom = async () => {
    if (!formData.name.trim() || !formData.capacity.trim() || !formData.location.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://127.0.0.1:8000/api/rooms/${selectedRoom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          capacity: parseInt(formData.capacity),
          location: formData.location,
          features: formData.features
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update room');
      }

      toast.success("Room updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedRoom(null);
      setFormData({
        name: "",
        capacity: "",
        location: "",
        features: []
      });
      fetchRooms();
    } catch (error) {
      console.error('Update room error:', error);
      toast.error(error.message || "Failed to update room.");
    }
  };

  // Delete room
  const handleDeleteRoom = async (roomId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://127.0.0.1:8000/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete room');
      }

      toast.success("Room deleted successfully!");
      fetchRooms();
    } catch (error) {
      console.error('Delete room error:', error);
      toast.error(error.message || "Failed to delete room.");
    }
  };

  useEffect(() => {
    fetchFeatures();
    fetchRooms();
  }, []);

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity.toString(),
      location: room.location,
      features: room.roomFeatures ? room.roomFeatures.map(f => f.id) : []
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenAddRoom = () => {
    setSelectedRoom(null);
    setFormData({
      name: "",
      capacity: "",
      location: "",
      features: []
    });
    setIsEditDialogOpen(true);
  };

  const handleFeatureChange = (featureId: number, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        features: [...formData.features, featureId]
      });
    } else {
      setFormData({
        ...formData,
        features: formData.features.filter(f => f !== featureId)
      });
    }
  };

  const handleSaveRoom = () => {
    if (selectedRoom) {
      handleUpdateRoom();
    } else {
      handleAddRoom();
    }
  };

  const getFeatureIcon = (featureName: string) => {
    const normalizedName = featureName.toLowerCase();
    if (normalizedName.includes('mic')) return Mic;
    if (normalizedName.includes('projector') || normalizedName.includes('monitor')) return Monitor;
    if (normalizedName.includes('wifi') || normalizedName.includes('internet')) return Wifi;
    if (normalizedName.includes('coffee')) return Coffee;
    if (normalizedName.includes('camera') || normalizedName.includes('video')) return Camera;
    if (normalizedName.includes('printer')) return Printer;
    if (normalizedName.includes('speaker') || normalizedName.includes('audio')) return Speaker;
    return Monitor; // Default icon
  };

  const handleLogout = () => {
    localStorage.removeItem('userProfilePicture');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  const totalRooms = rooms.length;
  const totalBookings = 0; // Will need to be fetched from API
  const avgUsage = 0; // Will need to be calculated from API data

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-700 to-blue-800 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-sky-600 mt-2">Manage meeting rooms and view analytics</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-sky-600 hover:text-sky-800 hover:bg-sky-100/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Link to="/user-management">
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </Button>
            </Link>
            <Link to="/booking-management">
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                <Calendar className="h-4 w-4 mr-2" />
                Booking Management
              </Button>
            </Link>
            <Button 
              onClick={handleOpenAddRoom}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-sky-800">Total Rooms</CardTitle>
              <MapPin className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-700">{totalRooms}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{totalBookings}</div>
              <p className="text-xs text-blue-600">Total bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Management */}
        <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sky-800">
                  <Wrench className="h-5 w-5" />
                  Feature Management
                </CardTitle>
                <CardDescription>Manage available room features</CardDescription>
              </div>
              <Button
                onClick={handleAddNewFeature}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell className="font-medium">{feature.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFeature(feature)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Feature</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the feature "{feature.name}"? This action cannot be undone and will remove this feature from all rooms.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFeature(feature.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Feature
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Room Management Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-800">
              <Settings className="h-5 w-5" />
              Room Management
            </CardTitle>
            <CardDescription>Manage all meeting rooms and their configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-sky-600" />
                        {room.capacity}
                      </div>
                    </TableCell>
                    <TableCell>{room.location}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {room.roomFeatures?.map((feature) => (
                          <Badge 
                            key={feature.id} 
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {feature.name}
                          </Badge>
                        ))}
                        {(!room.roomFeatures || room.roomFeatures.length === 0) && (
                          <span className="text-sm text-gray-500">No features</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Room</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the room "{room.name}"? This action cannot be undone and will remove all associated bookings and data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRoom(room.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Room
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Feature Add/Edit Dialog */}
        <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedFeature ? 'Edit Feature' : 'Add New Feature'}
              </DialogTitle>
              <DialogDescription>
                {selectedFeature ? 'Update the feature name.' : 'Create a new room feature.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="feature-name">Feature Name</Label>
                <Input
                  id="feature-name"
                  value={featureFormData.name}
                  onChange={(e) => setFeatureFormData({ name: e.target.value })}
                  placeholder="Enter feature name"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsFeatureDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveFeature}>
                  {selectedFeature ? 'Update Feature' : 'Create Feature'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Room Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedRoom ? 'Edit Room' : 'Add New Room'}
              </DialogTitle>
              <DialogDescription>
                {selectedRoom ? 'Update room details and features.' : 'Create a new meeting room with features.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter room name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  placeholder="Enter capacity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Enter room location"
                />
              </div>

              <div className="space-y-4">
                <Label>Features</Label>
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature) => {
                    const IconComponent = getFeatureIcon(feature.name);
                    return (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature.id}`}
                          checked={formData.features.includes(feature.id)}
                          onCheckedChange={(checked) => handleFeatureChange(feature.id, checked === true)}
                        />
                        <Label htmlFor={`feature-${feature.id}`} className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {feature.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoom}>
                {selectedRoom ? 'Update Room' : 'Create Room'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;
