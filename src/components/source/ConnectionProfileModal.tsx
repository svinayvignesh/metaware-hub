import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { connectionProfileAPI, type ConnectionProfile } from "@/services/api";

interface ConnectionProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceKind: string;
  onProfileCreated?: () => void;
}

const ConnectionProfileModal = ({
  open,
  onOpenChange,
  sourceKind,
  onProfileCreated,
}: ConnectionProfileModalProps) => {
  const { toast } = useToast();

  // Existing profiles
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New profile form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");

  // Test state
  const [testingProfile, setTestingProfile] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profiles when modal opens
  useEffect(() => {
    if (open && sourceKind) {
      fetchProfiles();
    }
  }, [open, sourceKind]);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const res = await connectionProfileAPI.list(sourceKind);
      setProfiles(res.return_data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load connection profiles", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async (profileName: string) => {
    setTestingProfile(profileName);
    try {
      const res = await connectionProfileAPI.test(profileName);
      const result = res.return_data;
      setTestResults(prev => ({ ...prev, [profileName]: result }));
      toast({
        title: result.status === "connected" ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.status === "connected" ? "default" : "destructive",
      });
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [profileName]: { status: "failed", message: err.message } }));
      toast({ title: "Test Failed", description: err.message, variant: "destructive" });
    } finally {
      setTestingProfile(null);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !host.trim() || !database.trim() || !user.trim()) {
      toast({ title: "Missing Fields", description: "Name, host, database, and user are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await connectionProfileAPI.create({
        name: name.trim(),
        type: sourceKind,
        connection_properties: {
          host: host.trim(),
          port: parseInt(port) || 5432,
          database: database.trim(),
          user: user.trim(),
          password: password,
        },
        description: description.trim() || undefined,
      });

      toast({ title: "Profile Created", description: `Connection profile '${name}' created.` });
      resetForm();
      await fetchProfiles();
      onProfileCreated?.();
    } catch (err: any) {
      toast({ title: "Create Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (profileName: string) => {
    try {
      await connectionProfileAPI.delete(profileName);
      toast({ title: "Profile Deleted", description: `Connection profile '${profileName}' deleted.` });
      await fetchProfiles();
      onProfileCreated?.();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setName("");
    setHost("");
    setPort("5432");
    setDatabase("");
    setUser("");
    setPassword("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Connection Profiles</DialogTitle>
          <DialogDescription>
            Connection profiles for {sourceKind} sources
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Existing profiles */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : profiles.length > 0 ? (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div
                  key={profile.name}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{profile.name}</span>
                      <Badge variant="outline" className="text-xs">{profile.type}</Badge>
                      {testResults[profile.name] && (
                        testResults[profile.name].status === "connected" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )
                      )}
                    </div>
                    {profile.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{profile.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTest(profile.name)}
                      disabled={testingProfile === profile.name}
                    >
                      {testingProfile === profile.name ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(profile.name)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No connection profiles for {sourceKind}
            </p>
          )}

          <Separator />

          {/* Create new profile */}
          {showForm ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">New Connection Profile</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Profile Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., production_pg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Host</Label>
                  <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="localhost" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Port</Label>
                  <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="5432" type="number" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Database</Label>
                  <Input value={database} onChange={(e) => setDatabase(e.target.value)} placeholder="mydb" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Username</Label>
                  <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="postgres" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Password</Label>
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Description (optional)</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Production read replica" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={isSaving} className="flex-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Profile
                </Button>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Add Connection Profile
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionProfileModal;
