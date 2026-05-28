const Loader = () => (
  <div className="flex min-h-[220px] items-center justify-center rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
    <div className="flex flex-col items-center gap-3 text-slate-900">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      <span>Loading...</span>
    </div>
  </div>
);

export default Loader;
