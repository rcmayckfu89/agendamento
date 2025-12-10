import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { navItems } from '../../constants/navigation';
import { useLayout } from '../../context/LayoutContext';
import { useAuth } from '../../context/AuthContext';
import { useUrgentMedicationsCount } from '../../hooks/useUrgentMedications';

export const Sidebar: React.FC = () => {
    const { isSidebarCollapsed, toggleSidebar } = useLayout();
    const { signOut } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { count: urgentMedicationsCount } = useUrgentMedicationsCount();

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

    return (
        <aside
            className={`bg-card flex flex-col border-r border-border h-full fixed left-0 top-0 overflow-y-auto z-10 
            transition-all duration-300 ease-in-out animate-slide-in-left
            ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        >
            <div className={`p-4 h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} animate-fade-in stagger-1`}>
                {!isSidebarCollapsed && (
                    <h1 className="text-2xl font-extrabold tracking-tighter text-foreground whitespace-nowrap overflow-hidden">
                        Agenda<span className="text-primary">+</span>
                    </h1>
                )}
                {isSidebarCollapsed && (
                    <h1 className="text-xl font-extrabold tracking-tighter text-foreground">
                        A<span className="text-primary">+</span>
                    </h1>
                )}

                <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ${isSidebarCollapsed ? 'hidden' : ''}`}
                    title="Recolher Menu"
                >
                    <span className="material-symbols-outlined text-xl">menu_open</span>
                </button>
            </div>

            {/* Collapse toggle button for collapsed state */}
            {isSidebarCollapsed && (
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

            <nav className="flex-1 px-3 py-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={isSidebarCollapsed ? item.name : ''}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 overflow-hidden relative ${isActive
                                ? 'bg-primary text-primary-foreground shadow-soft font-semibold'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            } ${isSidebarCollapsed ? 'justify-center' : ''}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`material-symbols-outlined text-2xl flex-shrink-0 ${isActive ? 'fill' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                                    {item.name}
                                </span>
                                {/* Badge for Medications */}
                                {item.path === '/medications' && urgentMedicationsCount > 0 && (
                                    <span className={`absolute ${isSidebarCollapsed ? 'top-1.5 right-1.5' : 'top-2 right-2'} bg-red-500 text-white rounded-full min-w-[20px] h-5 px-1.5 text-xs font-bold flex items-center justify-center shadow-md animate-pulse`}>
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
                    className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed ? 'Sair' : ''}
                >
                    <span className="material-symbols-outlined text-2xl flex-shrink-0">logout</span>
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                        Sair
                    </span>
                </button>

                <button
                    onClick={toggleTheme}
                    className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed ? (isDarkMode ? 'Modo Claro' : 'Modo Escuro') : ''}
                >
                    <span className="material-symbols-outlined fill text-2xl flex-shrink-0">
                        {isDarkMode ? 'light_mode' : 'dark_mode'}
                    </span>
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                        {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                    </span>
                </button>
            </div>
        </aside>
    );
};