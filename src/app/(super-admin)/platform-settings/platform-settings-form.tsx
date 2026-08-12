"use client";

import { useActionState } from "react";
import {
  updateSystemSettings,
  type UpdateSystemSettingsState,
} from "@/lib/actions/system-settings.actions";
import type { SystemSettingsData } from "@/lib/data/system-settings.data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: UpdateSystemSettingsState = {};

export function PlatformSettingsForm({ settings }: { settings: SystemSettingsData }) {
  const [state, formAction, pending] = useActionState(updateSystemSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="systemName">System name</Label>
        <Input id="systemName" name="systemName" defaultValue={settings.systemName} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={settings.tagline} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" name="logoUrl" defaultValue={settings.logoUrl} placeholder="https://..." />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="supportEmail">Support email</Label>
        <Input
          id="supportEmail"
          name="supportEmail"
          type="email"
          defaultValue={settings.supportEmail}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="defaultTrialDays">Default trial days</Label>
        <Input
          id="defaultTrialDays"
          name="defaultTrialDays"
          type="number"
          min={0}
          max={365}
          defaultValue={settings.defaultTrialDays}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="primaryColor">Primary color</Label>
        <Input
          id="primaryColor"
          name="primaryColor"
          defaultValue={settings.primaryColor}
          placeholder="#0f172a"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="privacyPolicy">Privacy policy</Label>
        <Textarea
          id="privacyPolicy"
          name="privacyPolicy"
          defaultValue={settings.privacyPolicy}
          rows={4}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="termsOfUse">Terms of use</Label>
        <Textarea id="termsOfUse" name="termsOfUse" defaultValue={settings.termsOfUse} rows={4} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="helpCenterContent">Help center content</Label>
        <Textarea
          id="helpCenterContent"
          name="helpCenterContent"
          defaultValue={settings.helpCenterContent}
          rows={4}
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">Settings saved.</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
