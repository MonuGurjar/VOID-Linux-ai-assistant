export function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Appearance</h2>
          <div className="text-muted-foreground">
            Dark and Light mode toggles will go here.
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Local AI Configuration</h2>
          <div className="text-muted-foreground">
            Model path, parameters, and system prompts will be configured here in Phase 2.
          </div>
        </section>
      </div>
    </div>
  );
}
