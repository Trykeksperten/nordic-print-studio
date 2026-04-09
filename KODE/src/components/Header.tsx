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
              (qty: number, value) => qty + (Number(value) || 0),
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
  const logoSrc = `${import.meta.env.BASE_URL}trykeksperten-logo.png`;

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
    { path: "/tekstiltryk/produkter", label: t("nav.textilePrint") },
    { path: "/storformatprint", label: t("nav.largeFormat") },
    { path: "/kontakt", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border overflow-visible">
      <div className="container mx-auto min-h-20 md:min-h-24 px-4 lg:px-8 py-1.5">
        <div className="hidden lg:grid min-h-[72px] md:min-h-[84px] grid-cols-[1fr_auto_1fr] items-center gap-6">
          <nav className="justify-self-start flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2.5 text-base font-medium rounded-lg transition-colors duration-200 ${
                  item.path === "/tekstiltryk/produkter"
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

          <Link to="/" className="justify-self-center inline-flex items-center px-6 py-2">
            <img
              src={logoSrc}
              alt="Trykeksperten"
              className="h-[3.125rem] md:h-[3.75rem] w-auto object-contain"
            />
          </Link>

          <div className="justify-self-end flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/kurv">
              <Button variant="hero" size="sm" className="text-base px-5 h-11">
                {t("nav.myCart")}{cartCount > 0 ? ` (${cartCount})` : ""}
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:hidden flex min-h-[56px] items-center justify-between">
          <Link to="/" className="inline-flex items-center px-2 py-1">
            <img
              src={logoSrc}
              alt="Trykeksperten"
              className="h-[2.2rem] w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/kurv" className="hidden sm:block">
              <Button variant="hero" size="sm">
                {t("nav.myCart")}{cartCount > 0 ? ` (${cartCount})` : ""}
              </Button>
            </Link>
            <button
              className="p-2 text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
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
                item.path === "/tekstiltryk/produkter"
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
