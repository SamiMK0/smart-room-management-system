import { useState, useEffect } from "react";
import { User, Edit, Save, X, Mail, Phone, MapPin, Calendar, ArrowLeft, LogOut, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  location: string;
  joinDate: string;
  avatar: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    location: '',
    joinDate: '',
    avatar: localStorage.getItem('userProfilePicture') || "/placeholder.svg"
  });
  const [editData, setEditData] = useState<UserData>({...userData});
  const [previewUrl, setPreviewUrl] = useState<string>(userData.avatar);

  // Fetch user data on component mount
  // Replace the useEffect with this version
  useEffect(() => {
  const fetchUserData = async () => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    // First try to use local storage data
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const formattedData: UserData = {
        id: parsedUser.id || '',
        firstName: parsedUser.name?.split(' ')[0] || 'User',
        lastName: parsedUser.name?.split(' ').slice(1).join(' ') || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        position: parsedUser.position || '',
        location: parsedUser.location || '',
        joinDate: parsedUser.created_at 
          ? new Date(parsedUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : 'Unknown',
        avatar: parsedUser.picture 
          ? parsedUser.picture.includes('http') 
            ? parsedUser.picture 
            : `http://127.0.0.1:8000/storage/${parsedUser.picture}`
          : "/placeholder.svg"
      };
      setUserData(formattedData);
      setEditData(formattedData);
      setPreviewUrl(formattedData.avatar);
    }

    // Then try to fetch fresh data if token exists
    if (token) {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const formattedData: UserData = {
            id: data.id || '',
            firstName: data.name?.split(' ')[0] || 'User',
            lastName: data.name?.split(' ').slice(1).join(' ') || '',
            email: data.email || '',
            phone: data.phone || '',
            position: data.position || '',
            location: data.location || '',
            joinDate: data.created_at 
              ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : 'Unknown',
            avatar: data.picture 
              ? data.picture.includes('http') 
                ? data.picture 
                : `http://127.0.0.1:8000/storage/${data.picture}`
              : "/placeholder.svg"
          };
          setUserData(formattedData);
          setEditData(formattedData);
          setPreviewUrl(formattedData.avatar);
        }
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
      }
    }
    
    setIsLoading(false);
  };

  fetchUserData();
}, [navigate]);

  const handleSave = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

    setIsLoading(true);

    try {
      const formData = new FormData();
      
      // Append all editable fields
      formData.append('name', `${editData.firstName} ${editData.lastName}`);
      formData.append('email', editData.email);
      formData.append('phone', editData.phone || '');
      formData.append('position', editData.position || '');
      formData.append('location', editData.location || '');

      // Handle profile picture upload if changed
      if (previewUrl !== userData.avatar) {
        if (previewUrl.startsWith('blob:')) {
          // New image selected
          const response = await fetch(previewUrl);
          const blob = await response.blob();
          const file = new File([blob], 'profile.jpg', { type: blob.type });
          formData.append('picture', file);
        } else if (previewUrl === "/placeholder.svg") {
          // Image removed
          formData.append('remove_picture', 'true');
        }
      }

      console.log('Sending update with:', {
          name: `${editData.firstName} ${editData.lastName}`,
          email: editData.email,
          phone: editData.phone,
          position: editData.position,
          location: editData.location,
          hasPicture: previewUrl !== userData.avatar
        });

      const response = await fetch(`http://127.0.0.1:8000/api/users/${userData.id}/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedData = await response.json();
      
      // Update local state with the response data
      const updatedUser = {
        ...userData,
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email,
        phone: editData.phone,
        position: editData.position,
        location: editData.location,
        avatar: updatedData.user.picture 
          ? updatedData.user.picture.includes('http')
            ? updatedData.user.picture
            : `http://127.0.0.1:8000/storage/${updatedData.user.picture}?${new Date().getTime()}`
        : previewUrl === "/placeholder.svg" ? "/placeholder.svg" : userData.avatar
      };

      setUserData(updatedUser);
      setPreviewUrl(updatedUser.avatar);
      
      
      // Update user data in localStorage
      const existingUserData = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...existingUserData,
        name: `${editData.firstName} ${editData.lastName}`,
        email: editData.email,
        phone: editData.phone,
        position: editData.position,
        location: editData.location,
        picture: updatedUser.avatar
      }));

      toast.success(updatedData.message || 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(userData);
    setPreviewUrl(userData.avatar);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('Image size should be less than 2MB');
      return;
    }
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  } else {
      // Reset to default if no file selected
      setPreviewUrl(userData.avatar);
  }
};

const handleRemoveImage = () => {
  setPreviewUrl("/placeholder.svg");
};

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfilePicture');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const refreshImage = (url: string) => {
  return `${url.split('?')[0]}?${new Date().getTime()}`;
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="bg-white/80 backdrop-blur-sm border-sky-200 hover:bg-sky-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-700 to-blue-800 bg-clip-text text-transparent">
                User Profile
              </h1>
              <p className="text-sky-600 mt-2">Manage your account information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-sky-600 hover:text-sky-800 hover:bg-sky-100/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm border-sky-200 hover:bg-sky-50"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-sky-200">
                    <AvatarImage 
                        src={
                            isEditing 
                              ? previewUrl 
                              : userData.avatar.includes('http') 
                                ? userData.avatar 
                                : userData.avatar.startsWith('/') 
                                  ? userData.avatar 
                                  : `http://127.0.0.1:8000/storage/${userData.avatar}`
                          }
                          alt={`${userData.firstName} ${userData.lastName}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                      />
                    <AvatarFallback className="bg-gradient-to-r from-sky-400 to-blue-500 text-white text-2xl">
                      {userData.firstName[0]}{userData.lastName[0]}
                    </AvatarFallback>

                    {isEditing && previewUrl !== "/placeholder.svg" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute -bottom-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                  </Avatar>
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="profile-picture-input"
                      />
                      <Label
                        htmlFor="profile-picture-input"
                        className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full cursor-pointer inline-flex items-center justify-center"
                      >
                        <Upload className="h-4 w-4" />
                      </Label>
                    </div>
                  )}
                </div>
              </div>
              <CardTitle className="text-sky-800">
                {userData.firstName} {userData.lastName}
              </CardTitle>
              <CardDescription className="text-sky-600">
                {userData.position}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-sky-500" />
                <span>{userData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-sky-500" />
                <span>Joined {userData.joinDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-800">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Edit your personal information" : "Your personal information"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={editData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className="bg-white/60 border-sky-200 focus:border-sky-400"
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="p-3 bg-white/60 rounded-lg border border-sky-100">
                        {userData.firstName}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={editData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className="bg-white/60 border-sky-200 focus:border-sky-400"
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="p-3 bg-white/60 rounded-lg border border-sky-100">
                        {userData.lastName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="bg-white/60 border-sky-200 focus:border-sky-400"
                      disabled={isLoading}
                    />
                  ) : (
                    <div className="p-3 bg-white/60 rounded-lg border border-sky-100">
                      {userData.email}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;