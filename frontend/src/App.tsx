
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MeetingRoomBooking from "./pages/MeetingRoomBooking";
import CreateMeeting from "./pages/CreateMeeting";
import MinutesManagement from "./pages/MinutesManagement";
import ViewMoM from "./pages/ViewMoM";
import AdminPanel from "./pages/AdminPanel";
import UserProfile from "./pages/UserProfile";
import UserManagement from "./pages/UserManagement";
import BookingManagement from "./pages/BookingManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/book-meeting" element={<MeetingRoomBooking />} />
          <Route path="/create-meeting" element={<CreateMeeting />} />
          <Route path="/minutes" element={<MinutesManagement />} />
          <Route path="/view-mom" element={<ViewMoM />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/booking-management" element={<BookingManagement />} />
          <Route path="/profile" element={<UserProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
