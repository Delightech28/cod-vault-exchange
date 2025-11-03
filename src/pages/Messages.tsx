import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  transaction_id: string;
  other_user_name: string;
  other_user_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  listing_title: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refetch conversations when messages change
          fetchConversations(currentUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user.id);
    fetchConversations(user.id);
  };

  const fetchConversations = async (userId: string) => {
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
          id,
          buyer_id,
          seller_id,
          created_at,
          listings (
            title
          ),
          messages (
            content,
            created_at,
            sender_id,
            read_by
          )
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const conversationPromises = transactions?.map(async (transaction: any) => {
        const otherUserId = transaction.buyer_id === userId ? transaction.seller_id : transaction.buyer_id;
        
        const { data: profile } = await supabase
          .rpc("get_public_profile", { p_user_id: otherUserId })
          .maybeSingle();

        const messages = transaction.messages || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        const unreadMessages = messages.filter(
          (msg: any) => msg.sender_id !== userId && !(msg.read_by || []).includes(userId)
        );

        return {
          transaction_id: transaction.id,
          other_user_name: profile?.display_name || profile?.full_name || profile?.username || "Anonymous",
          other_user_id: otherUserId,
          last_message: lastMessage?.content || "No messages yet",
          last_message_time: lastMessage?.created_at || transaction.created_at,
          unread_count: unreadMessages.length,
          listing_title: transaction.listings?.title || "Unknown Listing",
        };
      }) || [];

      const conversationsList = await Promise.all(conversationPromises);
      setConversations(conversationsList);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationClick = (transactionId: string) => {
    navigate(`/transaction/${transactionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Messages</h1>
          
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No conversations yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.transaction_id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleConversationClick(conversation.transaction_id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {conversation.other_user_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{conversation.other_user_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{conversation.listing_title}</p>
                        </div>
                      </div>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive">{conversation.unread_count}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {conversation.last_message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(conversation.last_message_time).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Messages;
