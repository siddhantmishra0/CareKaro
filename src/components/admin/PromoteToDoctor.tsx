import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Loader2, Search, User } from "lucide-react";
import { toast } from "sonner";

const SPECIALIZATIONS = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Endocrinologist",
  "Gastroenterologist",
  "Neurologist",
  "Oncologist",
  "Ophthalmologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Psychiatrist",
  "Pulmonologist",
  "Radiologist",
  "Urologist",
  "Gynecologist",
  "ENT Specialist",
  "Nephrologist",
  "Other",
];

interface SearchedUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

interface PromoteToDoctorProps {
  onSuccess?: () => void;
}

const PromoteToDoctor = ({ onSuccess }: PromoteToDoctorProps) => {
  const [searching, setSearching] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    specialization: "",
    license_number: "",
    hospital_affiliation: "",
    phone: "",
    bio: "",
  });

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      toast.error("Please enter at least 2 characters to search");
      return;
    }

    try {
      setSearching(true);
      setSearchResults([]);

      const { data, error } = await supabase.functions.invoke('promote-to-doctor', {
        body: { query: searchQuery },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add action=search to the URL
      const { data: searchData, error: searchError } = await supabase.functions.invoke('promote-to-doctor?action=search', {
        body: { query: searchQuery },
      });

      if (searchError) throw searchError;

      if (searchData?.error) {
        throw new Error(searchData.error);
      }

      setSearchResults(searchData?.users || []);
      
      if (searchData?.users?.length === 0) {
        toast.info("No users found matching your search");
      }
    } catch (error: any) {
      console.error("Error searching users:", error);
      toast.error(error.message || "Failed to search users");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: SearchedUser) => {
    setSelectedUser(user);
    setFormData(prev => ({
      ...prev,
      full_name: user.display_name || "",
    }));
    setSearchResults([]);
    setSearchQuery("");
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error("Please select a user to promote");
      return;
    }

    if (!formData.full_name || !formData.specialization || !formData.license_number) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setPromoting(true);

      const { data, error } = await supabase.functions.invoke('promote-to-doctor', {
        body: {
          user_id: selectedUser.id,
          full_name: formData.full_name,
          specialization: formData.specialization,
          license_number: formData.license_number,
          hospital_affiliation: formData.hospital_affiliation || undefined,
          phone: formData.phone || undefined,
          bio: formData.bio || undefined,
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(`${selectedUser.email} has been promoted to doctor`);
      
      // Reset form
      setSelectedUser(null);
      setFormData({
        full_name: "",
        specialization: "",
        license_number: "",
        hospital_affiliation: "",
        phone: "",
        bio: "",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Error promoting user:", error);
      toast.error(error.message || "Failed to promote user to doctor");
    } finally {
      setPromoting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setFormData({
      full_name: "",
      specialization: "",
      license_number: "",
      hospital_affiliation: "",
      phone: "",
      bio: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Promote Existing User to Doctor
        </CardTitle>
        <CardDescription>
          Search for an existing user and promote them to a doctor account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedUser ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.display_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center py-4">
              Search for an existing user by their email address or display name
            </p>
          </div>
        ) : (
          <form onSubmit={handlePromote} className="space-y-6">
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedUser.display_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleClearSelection}>
                Change
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="Dr. John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATIONS.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">Medical License Number *</Label>
                <Input
                  id="license_number"
                  placeholder="e.g., MCI-12345"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital_affiliation">Hospital/Clinic Affiliation</Label>
                <Input
                  id="hospital_affiliation"
                  placeholder="Hospital or clinic name"
                  value={formData.hospital_affiliation}
                  onChange={(e) => setFormData(prev => ({ ...prev, hospital_affiliation: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Brief description of experience and expertise..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={promoting}>
              {promoting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Promoting to Doctor...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Promote to Doctor
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PromoteToDoctor;
