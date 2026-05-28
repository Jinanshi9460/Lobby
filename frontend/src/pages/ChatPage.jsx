const ChatPage = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-glass">
        <h1 className="text-3xl font-semibold">Chat</h1>
        <p className="mt-2 text-slate-400">Connect with campus vendors for order updates and support.</p>
        <div className="mt-6 space-y-3">
          <button className="w-full rounded-3xl bg-slate-950 p-4 text-left">Campus Mart support</button>
          <button className="w-full rounded-3xl bg-slate-950 p-4 text-left">Print services desk</button>
        </div>
      </div>
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-glass">
        <div className="h-[560px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-slate-500">Select a chat thread to start messaging.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
