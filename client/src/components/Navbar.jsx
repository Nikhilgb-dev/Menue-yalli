function Navbar({ owner, admin, isAuthenticated, isAdminRoute }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(83,48,34,0.12)] bg-[rgba(255,248,242,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/assets/menu_logo.png"
            alt="MenuYalli"
            className="h-8 w-auto object-contain"
          />
        </div>
        {isAdminRoute && admin ? (
          <div className="text-right">
            <p className="text-sm font-semibold text-[#20120e]">Admin Dashboard</p>
            <p className="text-xs text-[#746157]">{admin.email}</p>
          </div>
        ) : isAuthenticated ? (
          <div className="text-right">
            <p className="text-sm font-semibold text-[#20120e]">
              {owner?.businessName}
            </p>
            <p className="text-xs text-[#746157]">
              {owner?.slug || "owner-dashboard"}
            </p>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Navbar;
