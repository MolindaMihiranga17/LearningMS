import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getSystemSettings } from "@/lib/data/system-settings.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformSettingsForm } from "./platform-settings-form";

export default async function PlatformSettingsPage() {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const settings = await getSystemSettings();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          White-label branding and platform-wide defaults.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent>
          <PlatformSettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
