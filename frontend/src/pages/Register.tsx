
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    picture: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, picture: file });
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      toast.error("Passwords don't match!");
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart/form-data request
      const registerData = new FormData();
      registerData.append('name', formData.name);
      registerData.append('email', formData.email);
      registerData.append('password', formData.password);
      registerData.append('password_confirmation', formData.password_confirmation);

      if (formData.picture) {
        registerData.append('picture', formData.picture); // Changed from 'profilePicture' to 'picture'
      }

      console.log('Sending registration request to backend...');

      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        body: registerData,
      });

      console.log('Response status:', response.status);

      // After successful registration in handleRegister function
      if (response.ok) {
        const result = await response.json();
        console.log('Registration successful:', result);

        // Store all necessary data
        localStorage.setItem('authToken', result.access_token);
        localStorage.setItem('user', JSON.stringify(result.user));
        if (result.user.picture) {
          localStorage.setItem('userProfilePicture', result.user.picture);
        }

        toast.success("Account created successfully! Welcome aboard.");
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
        toast.error(errorData.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-4 animate-fade-in">
      {/* Logout Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-sky-600 hover:text-sky-800 hover:bg-sky-100/50"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
            Join Smart Meeting
          </h1>
          <p className="text-slate-600 mt-2">Create your account to get started</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-bounce-in">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-slate-800">Create Account</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Fill in your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Profile Picture</Label>
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={previewUrl} />
                    <AvatarFallback className="bg-gradient-to-r from-sky-400 to-blue-500 text-white">
                      <Upload className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="border-sky-200 focus:border-sky-400 focus:ring-sky-200 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-700 font-medium">Full Name</Label>
                <Input
                  id="name" 
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="border-sky-200 focus:border-sky-400 focus:ring-sky-200 transition-all duration-200"
                />

              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border-sky-200 focus:border-sky-400 focus:ring-sky-200 transition-all duration-200"
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <div className="relative">
                  <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="border-sky-200 focus:border-sky-400 focus:ring-sky-200 transition-all duration-200"
                  />
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                      id="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.password_confirmation}
                      onChange={handleInputChange}
                      required
                      className="border-sky-200 focus:border-sky-400 focus:ring-sky-200 transition-all duration-200"
                    />

                    <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                  </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-sky-600 hover:text-sky-800 font-semibold hover:underline transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
