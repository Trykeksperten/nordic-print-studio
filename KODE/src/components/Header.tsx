import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { Menu, X } from "lucide-react";

const DESIGN_CART_STORAGE_KEY = "trykeksperten:design-cart:v1";

const readCartCount = () => {
  try {
    const raw = localStorage.getItem(DESIGN_CART_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum, item) => {
      const totalQuantity =
        typeof item?.totalQuantity === "number"
          ? item.totalQuantity
          : Object.values(item?.sizeQuantities ?? {}).reduce(
              (qty, value) => qty + (Number(value) || 0),
              0
            );
      return sum + Math.max(0, Number(totalQuantity) || 0);
    }, 0);
  } catch {
    return 0;
  }
};

const Header = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const syncCartCount = useCallback(() => {
    setCartCount(readCartCount());
  }, []);

  useEffect(() => {
    syncCartCount();
  }, [location.pathname, syncCartCount]);

  useEffect(() => {
    syncCartCount();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === DESIGN_CART_STORAGE_KEY) {
        syncCartCount();
      }
    };
    const onCartUpdated = () => syncCartCount();
    window.addEventListener("storage", onStorage);
    window.addEventListener("trykeksperten:cart-updated", onCartUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("trykeksperten:cart-updated", onCartUpdated as EventListener);
    };
  }, [syncCartCount]);

  const navItems = [
    { path: "/", label: t("nav.home") },
    { path: "/tekstiltryk/produkter", label: t("nav.textilePrint") },
    { path: "/storformatprint", label: t("nav.largeFormat") },
    { path: "/kontakt", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="font-bold text-xl tracking-tight text-foreground">
          Trykeksperten
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                item.path === "/"
                  ? location.pathname === item.path
                  : item.path === "/tekstiltryk/produkter"
                  ? location.pathname === "/tekstiltryk/produkter" || location.pathname.startsWith("/tekstiltryk/")
                  : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link to="/kurv" className="hidden sm:block">
            <Button variant="hero" size="sm">
              {t("nav.myCart")}{cartCount > 0 ? ` (${cartCount})` : ""}
            </Button>
          </Link>
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-border bg-background px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                item.path === "/"
                  ? location.pathname === item.path
                  : item.path === "/tekstiltryk/produkter"
                  ? location.pathname === "/tekstiltryk/produkter" || location.pathname.startsWith("/tekstiltryk/")
                  : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/kurv" onClick={() => setMobileOpen(false)} className="block mt-2">
            <Button variant="hero" className="w-full">
              {t("nav.myCart")}{cartCount > 0 ? ` (${cartCount})` : ""}
            </Button>
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
