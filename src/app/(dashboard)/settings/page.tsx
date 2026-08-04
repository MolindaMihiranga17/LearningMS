import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyProfile } from "@/lib/data/profile.data";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "@/app/change-password/change-password-form";

export default async function SettingsPage() {
  const profile = await getMyProfile();
  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            name={profile.name}
            email={profile.email}
            phone={profile.phone}
            avatarUrl={profile.avatarUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
