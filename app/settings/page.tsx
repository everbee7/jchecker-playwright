import { SettingsForm } from "@/components/settings/settings-form";
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Tune your target stack and control scraper concurrency.
        </p>
      </header>
      <SettingsForm />
    </div>
  );
}
