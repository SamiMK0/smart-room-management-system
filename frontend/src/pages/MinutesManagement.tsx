import { useState, useEffect } from "react";
import { ArrowLeft, Users, FileText, Plus, X, Upload, Save, Share2, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";

interface AttendeeType {
  id: string;
  name: string;
  email: string;
  present: boolean;
  user_id?: number;
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
  user_id?: number; // creator ID
}

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  assigneeId?: number;
  dueDate: string;
  priority: "low" | "medium" | "high";
}

interface DiscussionItem {
  id: string;
  title: string;
  description: string;
  duration: string;
}

const MinutesManagement = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const meetingId = searchParams.get('meetingId')
  const bookingId = searchParams.get('bookingId');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [duration, setDuration] = useState("");
  const [decisions, setDecisions] = useState("");
  const [meetingEndTime, setMeetingEndTime] = useState("");
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  
  const [attendees, setAttendees] = useState<AttendeeType[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  
  const [newAttendee, setNewAttendee] = useState({ name: "", email: "" });
  const [newDiscussion, setNewDiscussion] = useState({ title: "", description: "", duration: "15" });
  const [newActionItem, setNewActionItem] = useState({ 
    task: "", 
    assignee: "", 
    assigneeId: undefined as number | undefined,
    dueDate: new Date().toISOString().split('T')[0], 
    priority: "medium" as "low" | "medium" | "high" 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingMoM, setIsExistingMoM] = useState(false);
  const [momId, setMomId] = useState<string | null>(null);
  const [availableAssignees, setAvailableAssignees] = useState<AttendeeType[]>([]);

  // Fetch meeting and MoM data
  useEffect(() => {
    const fetchMeetingData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');
        
        if (!meetingId) {
          throw new Error("No meeting ID provided");
        }

        // Fetch meeting details
         const meetingResponse = await fetch(
            `http://127.0.0.1:8000/api/meetings/${meetingId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
            }
          );

        if (!meetingResponse.ok) {
            const errorData = await meetingResponse.json().catch(() => ({}));
            throw new Error(
              errorData.message || 
              `Failed to fetch meeting details: ${meetingResponse.statusText}`
            );
          }

        const meetingData = await meetingResponse.json();
        
        // Set meeting info
        setMeetingTitle(meetingData.title || '');
        if (meetingData.start_time) {
          const startDate = new Date(meetingData.start_time);
          
          const formattedDate = startDate.toISOString().split('T')[0];
          setMeetingDate(formattedDate);

          // Set start time
          const startHours = String(startDate.getHours()).padStart(2, '0');
          const startMinutes = String(startDate.getMinutes()).padStart(2, '0');
          setMeetingTime(`${startHours}:${startMinutes}`);
          
          // Set end time if exists
          if (meetingData.end_time) {
            const endDate = new Date(meetingData.end_time);
            const endHours = String(endDate.getHours()).padStart(2, '0');
            const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
            setMeetingEndTime(`${endHours}:${endMinutes}`);

            // Calculate duration
            const durationMs = endDate.getTime() - startDate.getTime();
            const durationMinutes = Math.floor(durationMs / (1000 * 60));
            setDuration(durationMinutes.toString());
          } else {
            setMeetingEndTime("");
            setDuration('60'); // Default duration if no end time
          }
        }

        await fetchAttendees(meetingId, token);

        // Check for existing MoM
        const momResponse = await fetch(`http://127.0.0.1:8000/api/moms?meeting_id=${meetingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        if (momResponse.ok) {
          const momData = await momResponse.json();
          if (momData) {
            setIsExistingMoM(true);
            setMomId(momData.id);
            
            // Process MoM items
            if (momData.items && momData.items.length > 0) {
              const decisions: string[] = [];
              const actionItems: ActionItem[] = [];
              const discussions: DiscussionItem[] = [];
              
              momData.items.forEach((item: any) => {
                if (item.item_type === 'decision') {
                  decisions.push(item.content);
                } else if (item.item_type === 'action_item') {
                  actionItems.push({
                    id: item.id.toString(),
                    task: item.content,
                    assignee: item.assignee?.name || 'Unassigned',
                    assigneeId: item.assigned_to,
                    dueDate: item.due_date || new Date().toISOString().split('T')[0],
                    priority: item.priority || 'medium'
                  });
                } else if (item.item_type === 'discussion') {
                  const [title, ...descParts] = item.content.split(':');
                  discussions.push({
                    id: item.id.toString(),
                    title: title.trim(),
                    description: descParts.join(':').trim(),
                    duration: item.duration || '15'
                  });
                }
              });
              
              setDecisions(decisions.join('\n'));
              setActionItems(actionItems);
              setDiscussions(discussions);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load meeting details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (meetingId) {
      fetchMeetingData();
    } else {
    toast({
      title: "Error",
      description: "No meeting ID provided",
      variant: "destructive",
    });
    navigate('/dashboard');
  }
  }, [meetingId, toast, navigate]);
  

const fetchAttendees = async (meetingId: string, token: string | null) => {
    setIsLoadingAttendees(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/meetings/${meetingId}/attendees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendees');
      }

      const attendeesData = await response.json();
      
      const formattedAttendees = attendeesData.map((attendee: any) => ({
        id: attendee.id.toString(),
        user_id: attendee.user_id,
        name: attendee.user?.name || '',
        email: attendee.user?.email || '',
        present: true
      }));
      
      setAttendees(formattedAttendees);
      setAvailableAssignees(formattedAttendees);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      toast({
        title: "Error",
        description: "Failed to load attendees",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  const handleAddAttendee = async () => {
  if (!newAttendee.email) {
    toast({ title: "Error", description: "Email is required", variant: "destructive" });
    return;
  }

  setIsLoadingAttendees(true);
  const token = localStorage.getItem('authToken');

  try {
    // First search for the user by email (case insensitive)
    const searchResponse = await fetch(
      `http://127.0.0.1:8000/api/users/search?email=${encodeURIComponent(newAttendee.email)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      // If search fails, try to create the user directly
      const createResponse = await fetch(
        `http://127.0.0.1:8000/api/users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newAttendee.name || newAttendee.email.split('@')[0],
            email: newAttendee.email,
            password: 'temporaryPassword123!',
            role: 'user'
          }),
        }
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const newUser = await createResponse.json();
      
      // Now add the new user as attendee
      const addResponse = await fetch(
        `http://127.0.0.1:8000/api/meetings/${meetingId}/attendees`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: newUser.id }),
        }
      );

      if (!addResponse.ok) {
        throw new Error('Failed to add new user as attendee');
      }
    } else {
      const users = await searchResponse.json();
      
      if (!Array.isArray(users)) {
        throw new Error('Invalid response format from server');
      }

      if (users.length === 0) {
        // If no users found, create a new one
        const createResponse = await fetch(
          `http://127.0.0.1:8000/api/users`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: newAttendee.name || newAttendee.email.split('@')[0],
              email: newAttendee.email,
              password: 'temporaryPassword123!',
              role: 'user'
            }),
          }
        );

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.message || 'Failed to create user');
        }

        const newUser = await createResponse.json();
        
        // Add the new user as attendee
        const addResponse = await fetch(
          `http://127.0.0.1:8000/api/meetings/${meetingId}/attendees`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: newUser.id }),
          }
        );

        if (!addResponse.ok) {
          throw new Error('Failed to add new user as attendee');
        }
      } else {
        // User exists, add them as attendee
        const userData = users[0];
        
        const addResponse = await fetch(
          `http://127.0.0.1:8000/api/meetings/${meetingId}/attendees`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userData.id }),
          }
        );

        if (!addResponse.ok) {
          const errorData = await addResponse.json();
          throw new Error(errorData.message || 'Failed to add attendee');
        }
      }
    }

    // Refresh attendees list
    await fetchAttendees(meetingId!, token);
    
    setNewAttendee({ name: "", email: "" });
    
    toast({ title: "Success", description: "Attendee added successfully" });
  } catch (error: any) {
    console.error('Error adding attendee:', error);
    toast({ 
      title: "Error", 
      description: error.message || "Failed to add attendee", 
      variant: "destructive" 
    });
  } finally {
    setIsLoadingAttendees(false);
  }
};

  
const handleRemoveAttendee = async (attendeeId: string) => {
  setIsLoadingAttendees(true);
  const token = localStorage.getItem('authToken');
  try {
    const response = await fetch(
        `http://127.0.0.1:8000/api/meetings/${meetingId}/attendees/${attendeeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

    if (!response.ok) {
      throw new Error('Failed to remove attendee');
    }

    setAttendees(attendees.filter(a => a.id !== attendeeId));
    setAvailableAssignees(availableAssignees.filter(a => a.id !== attendeeId));
    toast({ title: "Success", description: "Attendee removed successfully" });
  } catch (error) {
    toast({ 
      title: "Error", 
      description: error.message || "Failed to remove attendee", 
      variant: "destructive" 
    });
  }finally {
      setIsLoadingAttendees(false);
    }
};

  const toggleAttendeePresence = (id: string) => {
    setAttendees(attendees.map(a => 
      a.id === id ? { ...a, present: !a.present } : a
    ));
  };

  const handleAddDiscussion = () => {
  if (newDiscussion.title && newDiscussion.duration) {
    const item: DiscussionItem = {
      id: Date.now().toString(),
      title: newDiscussion.title.trim(),
      description: newDiscussion.description.trim(),
      duration: newDiscussion.duration
    };
    setDiscussions([...discussions, item]);
    setNewDiscussion({ title: "", description: "", duration: "15" });
  }
};

  const handleRemoveDiscussion = (id: string) => {
    setDiscussions(discussions.filter(item => item.id !== id));
  };

  const handleAddActionItem = () => {
  if (newActionItem.task && newActionItem.assignee) {
    const selectedAttendee = availableAssignees.find(a => a.name === newActionItem.assignee);
    
    if (!selectedAttendee) {
      toast({
        title: "Error",
        description: "Please select a valid assignee",
        variant: "destructive",
      });
      return;
    }

    const item: ActionItem = {
      id: Date.now().toString(),
      task: newActionItem.task.trim(),
      assignee: newActionItem.assignee,
      assigneeId: selectedAttendee.user_id,
      dueDate: newActionItem.dueDate,
      priority: newActionItem.priority
    };
    setActionItems([...actionItems, item]);
    setNewActionItem({ 
      task: "", 
      assignee: "", 
      assigneeId: undefined,
      dueDate: new Date().toISOString().split('T')[0], 
      priority: "medium" 
    });
  } else {
    toast({
      title: "Error",
      description: "Task and assignee are required",
      variant: "destructive",
    });
  }
};

  const handleRemoveActionItem = (id: string) => {
    setActionItems(actionItems.filter(item => item.id !== id));
  };

  const handleSaveDraft = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!meetingId) {
      throw new Error('No meeting ID provided');
    }

    // Prepare MoM items with proper formatting
    const momItems: any[] = [];
    let sequenceOrder = 1;

    // Add discussion items
    discussions.forEach(discussion => {
      momItems.push({
        item_type: 'discussion',
        content: `${discussion.title}: ${discussion.description}`,
        sequence_order: sequenceOrder++
      });
    });

    // Add decisions
    decisions.split('\n')
      .filter(decision => decision.trim())
      .forEach(decision => {
        momItems.push({
          item_type: 'decision',
          content: decision.trim(),
          sequence_order: sequenceOrder++
        });
      });

    // Add action items
    actionItems.forEach(actionItem => {
      momItems.push({
        item_type: 'action_item',
        content: actionItem.task,
        sequence_order: sequenceOrder++,
        assigned_to: actionItem.assigneeId || null,
        due_date: actionItem.dueDate || null
      });
    });

    const url = isExistingMoM && momId 
      ? `http://127.0.0.1:8000/api/moms/${momId}`
      : 'http://127.0.0.1:8000/api/moms';
    
    const method = isExistingMoM && momId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_id: parseInt(meetingId),
        created_by: user.id,
        items: momItems
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save minutes');
    }

    const data = await response.json();
    if (!isExistingMoM) {
      setMomId(data.id);
      setIsExistingMoM(true);
    }
    
    toast({
      title: "Success",
      description: isExistingMoM 
        ? "Minutes updated successfully" 
        : "Minutes created successfully",
    });
    
  } catch (error: any) {
    console.error('Error saving minutes:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to save minutes",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

// Update the handleFinalizeAndShare function to include minutes data
const handleFinalizeAndShare = async () => {
  try {
    await handleSaveDraft();
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Fetch the updated meeting data to get the MoM details
    const meetingResponse = await fetch(`http://127.0.0.1:8000/api/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!meetingResponse.ok) {
      const errorData = await meetingResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch updated meeting data');
    }

    const meetingData = await meetingResponse.json();

    toast({
      title: "Minutes Finalized",
      description: "Meeting minutes have been finalized and saved.",
    });
    
      navigate('/dashboard', { 
        state: { 
          momCreated: true,
          meetingId,
          bookingId,
          minutes: {
            decisions: decisions.split('\n').filter(d => d.trim()),
            actionItems: actionItems.map(item => ({
              task: item.task,
              assignee: item.assignee,
              assigneeId: item.assigneeId,
              dueDate: item.dueDate,
              priority: item.priority
            })),
            discussions: discussions.map(discussion => ({
              title: discussion.title,
              description: discussion.description,
              duration: discussion.duration
            }))
          }
        } 
      });
  } catch (error: any) {
    console.error('Error finalizing minutes:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to finalize minutes",
      variant: "destructive",
    });
  }
};

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm hover:bg-white/90">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-700 to-blue-800 bg-clip-text text-transparent">
              Meeting Minutes & Notes
            </h1>
            <p className="text-sky-600">
              {meetingTitle ? `Document meeting outcomes for: ${meetingTitle}` : "Document and manage meeting outcomes"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meeting Details */}
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-800">
                  <FileText className="h-5 w-5" />
                  Meeting Details
                  {bookingId && (
                    <Badge variant="outline" className="ml-2 bg-sky-50 text-sky-700 border-sky-200">
                      Booking ID: {bookingId}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Meeting Title</Label>
                    <Input
                      id="title"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      className="bg-white/70"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="bg-white/70"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <div className="flex gap-2">
                      <Input
                        id="start-time"
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="bg-white/70 flex-1"
                        placeholder="Start time"
                      />
                      <span className="self-center">to</span>
                      <Input
                        id="end-time"
                        type="time"
                        value={meetingEndTime}
                        onChange={(e) => setMeetingEndTime(e.target.value)}
                        className="bg-white/70 flex-1"
                        placeholder="End time"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="bg-white/70"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendees */}
                <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sky-800">
                      <Users className="h-5 w-5" />
                      Attendees
                      {isLoadingAttendees && (
                        <span className="text-sm text-gray-500 ml-2">Loading...</span>
                      )}
                    </CardTitle>
                    <CardDescription>Manage meeting attendees and track presence</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Name (optional)"
                          value={newAttendee.name}
                          onChange={(e) => setNewAttendee({...newAttendee, name: e.target.value})}
                          className="bg-white/70 flex-1"
                          disabled={isLoadingAttendees}
                        />
                        <Input
                          placeholder="Email*"
                          value={newAttendee.email}
                          onChange={(e) => setNewAttendee({...newAttendee, email: e.target.value})}
                          className="bg-white/70 flex-1"
                          disabled={isLoadingAttendees}
                          type="email"
                        />
                      </div>
                      <Button 
                        onClick={handleAddAttendee} 
                        className="bg-sky-500 hover:bg-sky-600" 
                        disabled={isLoadingAttendees || !newAttendee.email}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Attendee
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {attendees.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          {isLoadingAttendees ? 'Loading attendees...' : 'No attendees yet'}
                        </div>
                      ) : (
                        attendees.map((attendee) => (
                          <div key={attendee.id} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-sky-200">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleAttendeePresence(attendee.id)}
                                className={`p-1 rounded-full transition-colors ${
                                  attendee.present 
                                    ? "bg-green-100 text-green-600 hover:bg-green-200" 
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                                disabled={isLoadingAttendees}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <div>
                                <p className="font-medium text-gray-900">{attendee.name}</p>
                                <p className="text-sm text-gray-500">{attendee.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={attendee.present ? "default" : "secondary"} className={attendee.present ? "bg-green-500" : ""}>
                                {attendee.present ? "Present" : "Absent"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAttendee(attendee.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={isLoadingAttendees}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
            

            {/* Discussion Items */}
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="text-sky-800">Discussion Items</CardTitle>
                <CardDescription>Meeting topics and time allocation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    placeholder="Title *"
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                    className="bg-white/70 md:col-span-2"
                    required
                  />
                  <Input
                    placeholder="Duration (min) *"
                    type="number"
                    min="1"
                    value={newDiscussion.duration}
                    onChange={(e) => setNewDiscussion({...newDiscussion, duration: e.target.value})}
                    className="bg-white/70"
                    required
                  />
                  <Button 
                    onClick={handleAddDiscussion} 
                    className="bg-sky-500 hover:bg-sky-600"
                    disabled={!newDiscussion.title || !newDiscussion.duration}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Description"
                  value={newDiscussion.description}
                  onChange={(e) => setNewDiscussion({...newDiscussion, description: e.target.value})}
                  className="bg-white/70"
                />
                <div className="space-y-2">
                  {discussions.map((item) => (
                    <div key={item.id} className="p-3 bg-white/60 rounded-lg border border-sky-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.duration && (
                            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.duration}min
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDiscussion(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Decisions */}
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="text-sky-800">Decisions & Key Points</CardTitle>
                <CardDescription>Important decisions made during the meeting</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Document key decisions, important discussions, and outcomes..."
                  value={decisions}
                  onChange={(e) => setDecisions(e.target.value)}
                  className="min-h-[120px] bg-white/70"
                />
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="text-sky-800">Action Items</CardTitle>
                <CardDescription>Tasks and assignments with deadlines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input
                    placeholder="Task description"
                    value={newActionItem.task}
                    onChange={(e) => setNewActionItem({...newActionItem, task: e.target.value})}
                    className="bg-white/70 md:col-span-2"
                  />
                  <select
                    value={newActionItem.assignee}
                    onChange={(e) => setNewActionItem({...newActionItem, assignee: e.target.value})}
                    className="bg-white/70 border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select Assignee</option>
                    {availableAssignees.map(attendee => (
                      <option key={attendee.id} value={attendee.name}>
                        {attendee.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="date"
                    value={newActionItem.dueDate}
                    onChange={(e) => setNewActionItem({...newActionItem, dueDate: e.target.value})}
                    className="bg-white/70"
                  />
                  <Button onClick={handleAddActionItem} className="bg-sky-500 hover:bg-sky-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {actionItems.map((item) => (
                    <div key={item.id} className="p-3 bg-white/60 rounded-lg border border-sky-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.task}</p>
                          <p className="text-sm text-gray-600">Assigned to: {item.assignee}</p>
                          {item.dueDate && <p className="text-sm text-gray-500">Due: {item.dueDate}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveActionItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Save Options */}
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="text-sky-800">Save Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSaveDraft}
                  variant="outline" 
                  className="w-full bg-white/70 hover:bg-white/90"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isExistingMoM ? "Update Minutes" : "Save Draft"}
                </Button>
                <Button 
                  onClick={handleFinalizeAndShare}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                  disabled={isLoading}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Finalize & Share
                </Button>
              </CardContent>
            </Card>

            {/* Meeting Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
              <CardHeader>
                <CardTitle className="text-sky-800">Meeting Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendees:</span>
                  <span className="font-medium">{attendees.filter(a => a.present).length}/{attendees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discussion Items:</span>
                  <span className="font-medium">{discussions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Decisions:</span>
                  <span className="font-medium">{decisions.split('\n').filter(d => d.trim()).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Action Items:</span>
                  <span className="font-medium">{actionItems.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinutesManagement;