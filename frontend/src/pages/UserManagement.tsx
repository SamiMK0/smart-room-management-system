
import { useState } from "react";
import { User, Edit3, Trash2, Plus, Search, ArrowLeft, LogOut, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";


const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [userToDelete, setUserToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "User",
    password: ""
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/api/users', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      setUsers(data); // Make sure your API returns an array of users
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };



  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      role: "User",
      password: ""
    });
    setIsAddDialogOpen(true); // <-- just opens the dialog
  };

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://127.0.0.1:8000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors
          ? Object.values(data.errors).flat().join('\n')
          : data.message || 'Failed to add user';
        throw new Error(errorMsg);
      }

      toast.success("User added successfully!");
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        role: "User",
        password: ""
      });

      // Optional: refresh user list here
    } catch (error: any) {
      console.error('Add user error:', error);
      toast.error(error.message || "An error occurred while adding user.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);



  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) {
      toast.error("No user selected for update.");
      return;
    }

    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://127.0.0.1:8000/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password !== "" ? formData.password : undefined, // only send if not empty
          role: formData.role || 'User'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors
          ? Object.values(data.errors).flat().join('\n')
          : data.message || 'Failed to update user';
        throw new Error(errorMsg);
      }

      toast.success("User updated successfully!");
      setIsEditDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        role: "User",
        password: ""
      });
      setSelectedUser(null);

      // Optional: Refresh user list
    } catch (error: any) {
      console.error('Update user error:', error);
      toast.error(error.message || "An error occurred while updating user.");
    }
  };




 const handleDeleteUser = async (userId) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this user?");
  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("authToken");

    const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || "Failed to delete user";
      throw new Error(errorMsg);
    }

    toast.success("User deleted successfully");
    fetchUsers(); // Refresh list from DB
  } catch (error) {
    console.error("Delete user error:", error);
    toast.error(error.message || "An error occurred while deleting user.");
  }
};

const openDeleteDialog = (user) => {
  setUserToDelete(user);
  setIsDeleteDialogOpen(true);
};




  const handleLogout = () => {
    localStorage.removeItem('userProfilePicture');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

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
                User Management
              </h1>
              <p className="text-sky-600 mt-2">Manage system users and their permissions</p>
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
            <Button
              onClick={handleAddUser}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-500 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-sky-200 focus:border-sky-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-800">
              <User className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription>Manage all system users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              user.picture
                                ? `http://127.0.0.1:8000/storage/${user.picture}`
                                : "/placeholder.svg"
                            }
                            alt={user.name}
                          />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
  variant="ghost"
  size="sm"
  onClick={() => openDeleteDialog(user)}
  className="text-red-600 hover:text-red-800"
>
  <Trash2 className="h-4 w-4" />
</Button>

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>Add User</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Update User</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogDescription>
        Are you sure you want to delete user{' '}
        <strong>{userToDelete?.name}</strong>? This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <div className="flex justify-end gap-3 mt-6">
      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
        Cancel
      </Button>
      <Button
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={async () => {
          if (!userToDelete) return;
          try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`http://127.0.0.1:8000/api/users/${userToDelete.id}`, {
              method: "DELETE",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || "Failed to delete user");
            }
            toast.success("User deleted successfully");
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
            fetchUsers();
          } catch (error) {
            console.error("Delete user error:", error);
            toast.error(error.message || "An error occurred while deleting user.");
          }
        }}
      >
        Delete
      </Button>
    </div>
  </DialogContent>
</Dialog>

      </div>
    </div>
  );
};

export default UserManagement;
