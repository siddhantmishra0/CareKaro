import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { shareService } from "@/services/shareService";
import { Copy, Check, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface ShareReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
}

export const ShareReportModal = ({ open, onOpenChange, reportId, reportTitle }: ShareReportModalProps) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [expiresIn, setExpiresIn] = useState("24");
  const [maxAccess, setMaxAccess] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch existing shares
  const { data: shares, isLoading } = useQuery({
    queryKey: ['report-shares', reportId],
    queryFn: () => shareService.getReportShares(reportId),
    enabled: open,
  });

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: shareService.createShare,
    onSuccess: (data) => {
      toast({
        title: "Share Link Created",
        description: "Your report share link has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['report-shares', reportId] });
      
      // Copy to clipboard automatically
      const shareUrl = shareService.getShareUrl(data.share_token);
      navigator.clipboard.writeText(shareUrl);
      setCopiedToken(data.share_token);
      setTimeout(() => setCopiedToken(null), 2000);
      
      // Reset form
      setRecipientEmail("");
      setMaxAccess("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Revoke share mutation
  const revokeShareMutation = useMutation({
    mutationFn: shareService.revokeShare,
    onSuccess: () => {
      toast({
        title: "Share Link Revoked",
        description: "The share link has been deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ['report-shares', reportId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateShare = () => {
    createShareMutation.mutate({
      reportId,
      expiresInHours: parseInt(expiresIn),
      recipientEmail: recipientEmail || undefined,
      maxAccessCount: maxAccess ? parseInt(maxAccess) : undefined,
    });
  };

  const handleCopyLink = (token: string) => {
    const shareUrl = shareService.getShareUrl(token);
    navigator.clipboard.writeText(shareUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard.",
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Share Report"
      description={`Create a secure link to share "${reportTitle}" with healthcare providers`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Create New Share Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Create New Share Link</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient-email">Recipient Email (Optional)</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="doctor@hospital.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                For reference only - link will work without email
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expires-in">Expires In</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger id="expires-in" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="72">3 days</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                    <SelectItem value="720">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max-access">Max Access Count (Optional)</Label>
                <Input
                  id="max-access"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxAccess}
                  onChange={(e) => setMaxAccess(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateShare}
              disabled={createShareMutation.isPending}
              className="w-full"
            >
              {createShareMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Share Link
            </Button>
          </div>
        </div>

        {/* Existing Shares Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Active Share Links</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shares && shares.length > 0 ? (
            <div className="space-y-2">
              {shares.filter(s => s.is_active).map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-foreground">
                        {share.recipient_email || "Anonymous Link"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        • {share.access_count} views
                        {share.max_access_count && ` / ${share.max_access_count}`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(new Date(share.expires_at), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(share.share_token)}
                    >
                      {copiedToken === share.share_token ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeShareMutation.mutate(share.id)}
                      disabled={revokeShareMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No active share links. Create one to share this report.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
