const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg">
          <img src="/logo.png" alt="LM Market Logo" className="h-20 w-auto animate-pulse" />
          <div className="absolute inset-0 h-32 w-32 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    </div>
  )
}

export default Loader

