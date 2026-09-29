import { useEffect } from 'react';
import cn from 'classnames';
import { useUI } from '@/contexts/ui.context';
import { EdotoSidebarPanel } from '@/components/layouts/edoto-sidebar';

// Tiroir mobile : même barre latérale sombre que sur ordinateur (logo, identité, menus),
// même comportement que le dashboard des points de retrait (fond flouté, Échap pour fermer, page figée)
const MobileNavigation: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { displaySidebar, closeSidebar } = useUI();

  useEffect(() => {
    if (!displaySidebar) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeSidebar();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [displaySidebar, closeSidebar]);

  return (
    <div className="lg:hidden">
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-[#1F1B16]/40 backdrop-blur-[2px] transition-opacity duration-300',
          displaySidebar ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'edoto-sidebar fixed inset-y-0 z-[70] w-72 max-w-[85vw] transition-transform duration-300 ease-out ltr:left-0 rtl:right-0',
          displaySidebar
            ? 'translate-x-0 shadow-2xl'
            : 'ltr:-translate-x-full rtl:translate-x-full',
        )}
        aria-label="Navigation"
        aria-hidden={!displaySidebar}
      >
        <EdotoSidebarPanel onClose={closeSidebar}>{children}</EdotoSidebarPanel>
      </aside>
    </div>
  );
};
export default MobileNavigation;
