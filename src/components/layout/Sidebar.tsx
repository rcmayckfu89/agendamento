import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navItems } from '../../constants/navigation';
import { useLayout } from '../../context/LayoutContext';
import { useAuth } from '../../context/AuthContext';
import { useUrgentMedicationsCount } from '../../hooks/useUrgentMedications';

export const Sidebar: React.FC = () => {
    const {
        isSidebarCollapsed,
        toggleSidebar,
        isMobile,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu
    } = useLayout();
    const { signOut } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { count: urgentMedicationsCount } = useUrgentMedicationsCount();
    const location = useLocation();

    // Close mobile menu when route changes
    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname]);

    useEffect(() => {
        // Check for saved theme or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    // Sidebar content (shared between mobile and desktop)
    const sidebarContent = (
        <>
            <div className={`p-4 h-16 md:h-20 flex items-center ${isSidebarCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
                {(!isSidebarCollapsed || isMobile) && (
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tighter text-foreground whitespace-nowrap overflow-hidden">
                        Agenda<span className="text-primary">+</span>
                    </h1>
                )}
                {isSidebarCollapsed && !isMobile && (
                    <h1 className="text-xl font-extrabold tracking-tighter text-foreground">
                        A<span className="text-primary">+</span>
                    </h1>
                )}

                {/* Desktop: Collapse button */}
                {!isMobile && !isSidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Recolher Menu"
                    >
                        <span className="material-symbols-outlined text-xl">menu_open</span>
                    </button>
                )}

                {/* Mobile: Close button */}
                {isMobile && (
                    <button
                        onClick={closeMobileMenu}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Fechar Menu"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                )}
            </div>

            {/* Desktop collapsed: Expand button */}
            {!isMobile && isSidebarCollapsed && (
                <div className="w-full flex justify-center mb-2">
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Expandir Menu"
                    >
                        <span className="material-symbols-outlined text-xl">menu</span>
                    </button>
                </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={isSidebarCollapsed && !isMobile ? item.name : ''}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 overflow-hidden relative ${isActive
                                ? 'bg-primary text-primary-foreground shadow-soft font-semibold'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            } ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`material-symbols-outlined text-2xl flex-shrink-0 ${isActive ? 'fill' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed && !isMobile ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                                    {item.name}
                                </span>
                                {/* Badge for Medications */}
                                {item.path === '/medications' && urgentMedicationsCount > 0 && (
                                    <span className={`absolute ${isSidebarCollapsed && !isMobile ? 'top-1.5 right-1.5' : 'top-2 right-2'} bg-red-500 text-white rounded-full min-w-[20px] h-5 px-1.5 text-xs font-bold flex items-center justify-center shadow-md animate-pulse`}>
                                        {urgentMedicationsCount}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-3 border-t border-border mt-auto flex flex-col gap-2">
                <button
                    onClick={async () => {
                        await signOut();
                    }}
                    className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-colors overflow-hidden ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed && !isMobile ? 'Sair' : ''}
                >
                    <span className="material-symbols-outlined text-2xl flex-shrink-0">logout</span>
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed && !isMobile ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                        Sair
                    </span>
                </button>

                <button
                    onClick={toggleTheme}
                    className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors overflow-hidden ${isSidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed && !isMobile ? (isDarkMode ? 'Modo Claro' : 'Modo Escuro') : ''}
                >
                    <span className="material-symbols-outlined fill text-2xl flex-shrink-0">
                        {isDarkMode ? 'light_mode' : 'dark_mode'}
                    </span>
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed && !isMobile ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                        {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                    </span>
                </button>
            </div>
        </>
    );

    // MOBILE: Overlay sidebar
    if (isMobile) {
        return (
            <>
                {/* Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                        onClick={closeMobileMenu}
                    />
                )}

                {/* Mobile Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-72 bg-card flex flex-col border-r border-border
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    {sidebarContent}
                </aside>
            </>
        );
    }

    // DESKTOP: Fixed sidebar
    return (
        <aside
            className={`bg-card flex flex-col border-r border-border h-full fixed left-0 top-0 overflow-y-auto z-10 
            transition-all duration-300 ease-in-out
            ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        >
            {sidebarContent}
        </aside>
    );
};

// Mobile Header with Hamburger Menu
export const MobileHeader: React.FC = () => {
    const { isMobile, toggleMobileMenu } = useLayout();
    const { count: urgentMedicationsCount } = useUrgentMedicationsCount();

    if (!isMobile) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-30 bg-card border-b border-border h-14 flex items-center justify-between px-4 md:hidden">
            <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-accent text-foreground transition-colors relative"
                title="Menu"
            >
                <span className="material-symbols-outlined text-2xl">menu</span>
                {/* Badge indicator */}
                {urgentMedicationsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            <h1 className="text-xl font-extrabold tracking-tighter text-foreground">
                Agenda<span className="text-primary">+</span>
            </h1>

            <div className="w-10" /> {/* Spacer for centering */}
        </header>
    );
};