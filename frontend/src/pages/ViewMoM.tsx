import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Clock, Users, CheckCircle, Target, MessageSquare, User, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface MoMItem {
  id: string;
  item_type: 'discussion' | 'decision' | 'action_item';
  content: string;
  sequence_order: number;
  assigned_to?: number | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high' | null;
  duration?: string | null;
  assignee?: {
    name: string;
    email: string;
  };
}

interface MoMData {
  id: string;
  meeting_id: number;
  created_at: string;
  items: MoMItem[];
  meeting: {
    title: string;
    start_time: string;
    end_time: string;
    booking: {
      room: {
        name: string;
        location: string;
      };
    };
  };
}

const ViewMoM = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const momId = searchParams.get('momId');
  const [momData, setMomData] = useState<MoMData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMoM = async () => {
      if (!momId) {
        toast({
          title: "Error",
          description: "No MOM ID provided",
          variant: "destructive",
        });
        navigate('/minutes');
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://127.0.0.1:8000/api/moms/${momId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch MOM details');
        }

        const data = await response.json();
        setMomData(data);
      } catch (error) {
        console.error('Error fetching MOM:', error);
        toast({
          title: "Error",
          description: "Failed to load MOM details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoM();
  }, [momId, toast, navigate]);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-800">Loading Meeting Minutes</CardTitle>
              <CardDescription>Please wait while we fetch the details...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!momData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">MOM Not Found</CardTitle>
              <CardDescription>The requested meeting minutes could not be found.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/minutes')} className="bg-sky-500 hover:bg-sky-600">
                Back to Minutes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const discussions = momData.items.filter(item => item.item_type === 'discussion');
  const decisions = momData.items.filter(item => item.item_type === 'decision');
  const actionItems = momData.items.filter(item => item.item_type === 'action_item');

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/minutes")}
              className="bg-white/80 backdrop-blur-sm border-sky-200 hover:bg-sky-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-700 to-blue-800 bg-clip-text text-transparent">
                Meeting Minutes
              </h1>
              <p className="text-sky-600 mt-2">View meeting minutes details</p>
            </div>
          </div>
        </div>

        {/* Meeting Info */}
        <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-800">
              <Calendar className="h-5 w-5" />
              {momData.meeting.title}
            </CardTitle>
            <CardDescription>Meeting Information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Room:</span>
                <span>{momData.meeting.booking.room.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Date:</span>
                <span>{formatDate(momData.meeting.start_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Time:</span>
                <span>
                  {formatTime(momData.meeting.start_time)} - {formatTime(momData.meeting.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Created:</span>
                <span>{formatDate(momData.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discussions */}
        {discussions.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sky-800">
                <MessageSquare className="h-5 w-5" />
                Discussion Points ({discussions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {discussions.map((discussion, index) => {
                const [title, ...descParts] = discussion.content.split(':');
                return (
                  <div key={discussion.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{title.trim()}</h4>
                          {descParts.length > 0 && (
                            <p className="text-gray-700 mt-2">{descParts.join(':').trim()}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {discussion.duration ? `${discussion.duration} min` : 'N/A min'}
                        </Badge>
                      </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Decisions */}
        {decisions.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sky-800">
                <CheckCircle className="h-5 w-5" />
                Decisions Made ({decisions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {decisions.map((decision, index) => (
                <div key={decision.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <p className="text-gray-900">{decision.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sky-800">
                <Target className="h-5 w-5" />
                Action Items ({actionItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        {item.assignee && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{item.assignee.name}</span>
                          </div>
                        )}
                        {item.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDate(item.due_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {item.priority && (
                      <Badge className={getPriorityColor(item.priority)} variant="outline">
                        {item.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Content Message */}
        {discussions.length === 0 && decisions.length === 0 && actionItems.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-sky-200 shadow-lg">
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No meeting content available for this MOM.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ViewMoM;