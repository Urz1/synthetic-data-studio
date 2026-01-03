"use client"

import { useState, useEffect } from "react"
import { TwoFactorSettings } from "@/components/settings/two-factor-settings"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const initials = (user?.full_name || user?.email || "User")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  
  // Profile state
  const [fullName, setFullName] = useState(user?.full_name || "")
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  
  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.is_2fa_enabled ?? false)
  
  useEffect(() => {
    setIs2FAEnabled(user?.is_2fa_enabled ?? false)
  }, [user?.is_2fa_enabled])

  const handleProfileSave = async () => {
    setIsProfileSaving(true)
    try {
      await api.updateProfile({ full_name: fullName })
      await refreshUser() // Refresh user state in context
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsPasswordSaving(true)
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      })
      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await api.deleteAccount()
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      })
      await logout()
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Settings"
          description="Manage your account settings and preferences"
        />

        <Tabs defaultValue="profile" className="space-y-6">
          <div className="rounded-xl border bg-card/40 p-1 w-fit">
            <TabsList className="bg-transparent">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <div className="grid gap-6">
              <Card className="bg-card/40">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your public profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={user?.email} disabled />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleProfileSave} disabled={isProfileSaving}>
                    {isProfileSaving ? (
                      "Saving..."
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="grid gap-6">
              {/* Two-Factor Authentication */}
              <TwoFactorSettings
                is2FAEnabled={is2FAEnabled}
                onStatusChange={setIs2FAEnabled}
              />
              <Card className="bg-card/40">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {/* Password strength indicator */}
                    {newPassword && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              newPassword.length < 8 ? 'w-1/4 bg-destructive' :
                              newPassword.length < 12 ? 'w-1/2 bg-warning' :
                              /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword) ? 'w-full bg-success' :
                              'w-3/4 bg-primary'
                            }`}
                          />
                        </div>
                        <span className={`text-xs ${
                          newPassword.length < 8 ? 'text-destructive' :
                          newPassword.length < 12 ? 'text-warning' :
                          /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword) ? 'text-success' :
                          'text-primary'
                        }`}>
                          {newPassword.length < 8 ? 'Weak' :
                           newPassword.length < 12 ? 'Fair' :
                           /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword) ? 'Strong' :
                           'Good'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handlePasswordChange} 
                    disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isPasswordSaving ? (
                      "Updating..."
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-destructive/20 bg-card/40">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                    <h4 className="font-semibold text-sm mb-1">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}>
                          {isDeleting ? (
                            "Deleting..."
                          ) : (
                            "Delete My Account"
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <div className="grid gap-6">
              <Card className="bg-card/40">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Choose how Synth Studio looks. Your selection applies across the signed-in app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <RadioGroup
                      value={theme || "system"}
                      onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                      className="grid gap-3"
                    >
                      <label className="flex items-center gap-3 rounded-lg border border-border p-4">
                        <RadioGroupItem value="system" />
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">System</div>
                          <div className="text-xs text-muted-foreground">Match your device setting</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 rounded-lg border border-border p-4">
                        <RadioGroupItem value="light" />
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">Light</div>
                          <div className="text-xs text-muted-foreground">Bright surfaces for daytime work</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 rounded-lg border border-border p-4">
                        <RadioGroupItem value="dark" />
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">Dark</div>
                          <div className="text-xs text-muted-foreground">Low-glare surfaces for nighttime work</div>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  )
}
