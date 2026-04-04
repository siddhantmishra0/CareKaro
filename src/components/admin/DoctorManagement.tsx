import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doctorService, DoctorProfile } from "@/services/doctorService";
import { notificationService } from "@/services/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, 
  User, Building, Phone, FileText, Ban, UserPlus, UserCheck, Filter, Search, ArrowUpDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateDoctorForm from "./CreateDoctorForm";
import PromoteToDoctor from "./PromoteToDoctor";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "suspended";
type SortOption = "name_asc" | "name_desc" | "date_newest" | "date_oldest";

const DoctorManagement = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date_newest");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    doctorId: string;
    action: 'approved' | 'rejected' | 'suspended';
    doctorName: string;
  } | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getAllDoctorProfiles();
      setDoctors(data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (doctorId: string, status: 'approved' | 'rejected' | 'suspended') => {
    if (!user) return;

    try {
      setActionLoading(doctorId);
      const updatedDoctor = await doctorService.verifyDoctor(doctorId, status, user.id);
      
      setDoctors(prev => prev.map(d => 
        d.id === doctorId 
          ? { 
              ...d, 
              verification_status: status,
              verified_at: status === 'approved' ? new Date().toISOString() : null,
              verified_by: user.id
            } 
          : d
      ));

      // Send email notification to doctor about their registration status
      try {
        // Get the doctor's email using edge function
        const doctorEmail = await doctorService.getUserEmail(updatedDoctor.user_id);
        
        if (doctorEmail) {
          await notificationService.sendDoctorRegistrationStatusNotification(
            doctorEmail,
            updatedDoctor.full_name,
            status
          );
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success(`Doctor ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'suspended'} successfully`);
    } catch (error) {
      console.error("Error updating doctor status:", error);
      toast.error("Failed to update doctor status");
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const getStatusBadge = (status: string, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClasses = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-1.5'
    };
    
    switch (status) {
      case 'approved':
        return (
          <Badge className={`bg-green-600 hover:bg-green-700 text-white ${sizeClasses[size]}`}>
            <CheckCircle className={`${size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className={sizeClasses[size]}>
            <XCircle className={`${size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
            Rejected
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className={`bg-amber-600 hover:bg-amber-700 text-white ${sizeClasses[size]}`}>
            <Ban className={`${size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className={`bg-yellow-100 text-yellow-800 border-yellow-300 ${sizeClasses[size]}`}>
            <Clock className={`${size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} mr-1 animate-pulse`} />
            Pending Review
          </Badge>
        );
    }
  };

  const pendingDoctors = doctors.filter(d => d.verification_status === 'pending');
  const approvedDoctors = doctors.filter(d => d.verification_status === 'approved');
  const rejectedDoctors = doctors.filter(d => d.verification_status === 'rejected' || d.verification_status === 'suspended');

  // Filtered and sorted doctors based on dropdown selection, search query, and sort option
  const filteredDoctors = useMemo(() => {
    let result = doctors;
    
    // Apply status filter
    switch (statusFilter) {
      case 'pending':
        result = pendingDoctors;
        break;
      case 'approved':
        result = approvedDoctors;
        break;
      case 'rejected':
        result = doctors.filter(d => d.verification_status === 'rejected');
        break;
      case 'suspended':
        result = doctors.filter(d => d.verification_status === 'suspended');
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(d => 
        d.full_name.toLowerCase().includes(query) ||
        d.doctor_id.toLowerCase().includes(query) ||
        d.specialization.toLowerCase().includes(query) ||
        d.license_number.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'name_asc':
          return a.full_name.localeCompare(b.full_name);
        case 'name_desc':
          return b.full_name.localeCompare(a.full_name);
        case 'date_newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });
    
    return result;
  }, [doctors, statusFilter, searchQuery, sortOption, pendingDoctors, approvedDoctors]);

  const DoctorCard = ({ doctor }: { doctor: DoctorProfile }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Dr. {doctor.full_name}</h3>
                <Badge variant="outline" className="font-mono text-xs">
                  {doctor.doctor_id}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  License: {doctor.license_number}
                </span>
                {doctor.hospital_affiliation && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {doctor.hospital_affiliation}
                  </span>
                )}
                {doctor.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {doctor.phone}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Registered: {format(new Date(doctor.created_at), "PPP")}
              </p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(doctor.verification_status)}
            {doctor.verified_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Verified: {format(new Date(doctor.verified_at), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        {doctor.bio && (
          <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
            {doctor.bio}
          </p>
        )}

        {/* Action buttons for pending doctors */}
        {doctor.verification_status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={actionLoading === doctor.id}
              onClick={() => setConfirmDialog({
                open: true,
                doctorId: doctor.id,
                action: 'approved',
                doctorName: doctor.full_name
              })}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={actionLoading === doctor.id}
              onClick={() => setConfirmDialog({
                open: true,
                doctorId: doctor.id,
                action: 'rejected',
                doctorName: doctor.full_name
              })}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {/* Action buttons for approved doctors */}
        {doctor.verification_status === 'approved' && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-amber-600 border-amber-600 hover:bg-amber-50"
              disabled={actionLoading === doctor.id}
              onClick={() => setConfirmDialog({
                open: true,
                doctorId: doctor.id,
                action: 'suspended',
                doctorName: doctor.full_name
              })}
            >
              <Ban className="h-4 w-4 mr-1" />
              Suspend
            </Button>
          </div>
        )}

        {/* Reinstate button for suspended/rejected doctors */}
        {(doctor.verification_status === 'suspended' || doctor.verification_status === 'rejected') && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50"
              disabled={actionLoading === doctor.id}
              onClick={() => setConfirmDialog({
                open: true,
                doctorId: doctor.id,
                action: 'approved',
                doctorName: doctor.full_name
              })}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Reinstate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Doctor Management</h2>
        <p className="text-muted-foreground">Review and manage doctor registrations</p>
      </div>

      {/* Stats with Status Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Pending Verification</CardDescription>
              {getStatusBadge('pending', 'md')}
            </div>
            <CardTitle className="text-3xl">{pendingDoctors.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Awaiting admin review</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Approved Doctors</CardDescription>
              {getStatusBadge('approved', 'md')}
            </div>
            <CardTitle className="text-3xl">{approvedDoctors.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Can send reports to patients</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Rejected / Suspended</CardDescription>
              {getStatusBadge('suspended', 'md')}
            </div>
            <CardTitle className="text-3xl">{rejectedDoctors.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Access revoked or denied</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Status:</span>
          </div>
          <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({doctors.length})</SelectItem>
              <SelectItem value="pending">Pending ({pendingDoctors.length})</SelectItem>
              <SelectItem value="approved">Approved ({approvedDoctors.length})</SelectItem>
              <SelectItem value="rejected">Rejected ({doctors.filter(d => d.verification_status === 'rejected').length})</SelectItem>
              <SelectItem value="suspended">Suspended ({doctors.filter(d => d.verification_status === 'suspended').length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">Sort:</span>
          </div>
          <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_newest">Newest First</SelectItem>
              <SelectItem value="date_oldest">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Clear All */}
        {(statusFilter !== 'all' || searchQuery || sortOption !== 'date_newest') && (
          <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setSearchQuery(''); setSortOption('date_newest'); }}>
            Clear all
          </Button>
        )}
      </div>

      <Tabs defaultValue="create">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="create">
            <UserPlus className="h-4 w-4 mr-1" />
            Create New
          </TabsTrigger>
          <TabsTrigger value="promote">
            <UserCheck className="h-4 w-4 mr-1" />
            Promote Existing
          </TabsTrigger>
          <TabsTrigger value="doctors">
            View Doctors
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {filteredDoctors.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <CreateDoctorForm onSuccess={fetchDoctors} />
        </TabsContent>

        <TabsContent value="promote" className="mt-4">
          <PromoteToDoctor onSuccess={fetchDoctors} />
        </TabsContent>

        <TabsContent value="doctors" className="mt-4">
          {filteredDoctors.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No doctors found
                  {searchQuery && ` matching "${searchQuery}"`}
                  {statusFilter !== 'all' && ` with status "${statusFilter}"`}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button 
                    variant="link" 
                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'approved' 
                ? 'Approve Doctor' 
                : confirmDialog?.action === 'rejected'
                ? 'Reject Doctor'
                : 'Suspend Doctor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmDialog?.action === 'approved' ? 'approve' : confirmDialog?.action === 'rejected' ? 'reject' : 'suspend'}{' '}
              Dr. {confirmDialog?.doctorName}?
              {confirmDialog?.action === 'approved' && ' They will be able to send reports to patients.'}
              {confirmDialog?.action === 'suspended' && ' They will no longer be able to send reports to patients.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmDialog?.action === 'approved' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-destructive hover:bg-destructive/90'
              }
              onClick={() => confirmDialog && handleVerification(confirmDialog.doctorId, confirmDialog.action)}
            >
              {confirmDialog?.action === 'approved' ? 'Approve' : confirmDialog?.action === 'rejected' ? 'Reject' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorManagement;
