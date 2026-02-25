import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div id="app">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onOpenSettings={() => setIsSettingsOpen(true)} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <main id="main-content">
                <Outlet context={{ toggleSidebar }} />
            </main>
        </div>
    );
};
