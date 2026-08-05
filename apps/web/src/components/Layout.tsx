import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/dashboard",   icon: "◈", label: "Dashboard"  },
  { to: "/tracks",      icon: "♫", label: "Tracks"      },
  { to: "/marketplace", icon: "◎", label: "Marketplace" },
  { to: "/podcast",     icon: "⏺", label: "Podcast"     },
  { to: "/rights",      icon: "⚖", label: "Rights"      },
  { to: "/plans",       icon: "✦", label: "Plans"       },
  { to: "/settings",   icon: "⚙", label: "Settings"    },
];

const ADMIN_NAV = { to: "/admin", icon: "◆", label: "Admin" };

export default function Layout() {
  const { user, logout, offline } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.email?.includes("admin") || false;

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "var(--sidebar-w)",
          flexShrink: 0,
          background: "var(--ink)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "var(--s6) var(--s6) var(--s5)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--warm-white)",
              letterSpacing: "-0.02em",
            }}
          >
            Umhlabatea
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--gold)",
              marginTop: 2,
              textTransform: "uppercase",
            }}
          >
            Creator OS
          </div>
        </div>

        {/* Offline badge */}
        {offline && (
          <div
            style={{
              margin: "var(--s3) var(--s4) 0",
              padding: "5px var(--s3)",
              borderRadius: "var(--r-sm)",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--gold)",
              letterSpacing: "0.08em",
              textAlign: "center",
            }}
          >
            OFFLINE MODE
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "var(--s4) var(--s3)" }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "var(--s3)",
                padding: "10px var(--s3)",
                borderRadius: "var(--r)",
                color: isActive ? "var(--warm-white)" : "rgba(255,255,255,0.5)",
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                marginBottom: 2,
                transition: "all 0.12s",
                textDecoration: "none",
              })}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to={ADMIN_NAV.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "var(--s3)",
                padding: "10px var(--s3)",
                borderRadius: "var(--r)",
                color: isActive ? "var(--gold)" : "rgba(201,168,76,0.6)",
                background: isActive ? "rgba(201,168,76,0.10)" : "transparent",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 500,
                marginTop: "var(--s4)",
                textDecoration: "none",
              })}
            >
              <span style={{ fontSize: 16 }}>{ADMIN_NAV.icon}</span>
              {ADMIN_NAV.label}
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div
          style={{
            padding: "var(--s4) var(--s4)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)", marginBottom: "var(--s3)" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink)",
                flexShrink: 0,
              }}
            >
              {(user?.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, color: "var(--warm-white)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {user?.tier ?? "free"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "var(--r-sm)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.06em",
              cursor: "pointer",
              border: "none",
              textTransform: "uppercase",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)"; (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--bg)",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
