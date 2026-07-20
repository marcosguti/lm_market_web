const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary">
      <div className="initial-loader">
        <div className="initial-loader-logo-wrapper">
          <img
            src="/logo.png"
            alt="LM Market Logo"
            className="initial-loader-logo"
          />
        </div>
      </div>
    </div>
  )
}

export default Loader
