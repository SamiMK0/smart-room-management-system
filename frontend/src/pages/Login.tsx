import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: "",
      password: "",
      general: ""
    };

    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    if (errors.email) {
      toast.error(errors.email);
    } else if (errors.password) {
      toast.error(errors.password);
    }
    return;
  }

  setIsLoading(true);
  setErrors({ email: "", password: "", general: "" });

  try {
    const response = await fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid email or password");
      } else if (response.status === 422) {
        const errorMsg = data.errors 
          ? Object.values(data.errors).flat().join('\n')
          : "Validation error";
        throw new Error(errorMsg);
      } else if (response.status === 500) {
        throw new Error("Server error. Please try again later.");
      } else {
        throw new Error(data.message || "Login failed");
      }
    }

    localStorage.setItem('authToken', data.access_token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    toast.success("Login successful! Welcome back.");

    // ✅ Navigate based on role
    if (data.user?.role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }

  } catch (error: any) {
    console.error('Login error:', error);

    if (error.message.includes("Failed to fetch")) {
      toast.error("Network error. Please check your connection.");
    } else if (error.message.includes("Invalid email or password")) {
      toast.error("Invalid email or password. Please try again.");
    } else {
      toast.error(error.message || "An unexpected error occurred");
    }

    setErrors(prev => ({
      ...prev,
      general: error.message || "Login failed"
    }));
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-600 mt-2">Sign in to your Smart Meeting account</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-bounce-in">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-slate-800">Sign In</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: "" }));
                  }}
                  required
                  className={`border-sky-200 focus:border-sky-400 focus:ring-sky-200 transition-all duration-200 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2 relative">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <div className="relative">
                  <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors(prev => ({ ...prev, password: "" }));
                      }}
                      required
                      className={`border-sky-200 focus:border-sky-400 focus:ring-sky-200 transition-all duration-200 ${
                        errors.password ? "border-red-500" : ""
                      }`}
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
                {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-sky-600 hover:text-sky-800 hover:underline transition-colors duration-200"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Don't have an account?{" "}
                <Link 
                  to="/register" 
                  className="text-sky-600 hover:text-sky-800 font-semibold hover:underline transition-colors duration-200"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;