import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { Menu, X } from "lucide-react";

const Header = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/", label: t("nav.home") },
    { path: "/tekstiltryk", label: t("nav.textilePrint") },
    { path: "/storformatprint", label: t("nav.largeFormat") },
    { path: "/produkter", label: t("nav.products") },
    { path: "/design", label: t("nav.uploadDesign") },
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
                location.pathname === item.path
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
          <Link to="/design" className="hidden sm:block">
            <Button variant="hero" size="sm">
              {t("nav.getQuote")}
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
                location.pathname === item.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/design" onClick={() => setMobileOpen(false)} className="block mt-2">
            <Button variant="hero" className="w-full">
              {t("nav.getQuote")}
            </Button>
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
