import CreateAgentForm from "@/components/CreateAgentForm";

export default function NewAgentPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Create New Agent</h1>
        <p className="mt-2 text-zinc-400">
          Deploy an AI agent with its own Stellar wallet
        </p>
      </div>
      <CreateAgentForm />
    </div>
  );
}
