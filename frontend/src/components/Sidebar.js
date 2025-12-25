import React from 'react';

const Sidebar = ({ activeView, setView }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'upload', label: 'New Audit' },
        { id: 'reports', label: 'Audit History' },
    ];

    return (
        <aside className="sidebar">
            <div className="brand" style={{ marginBottom: '2rem', paddingLeft: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--primary-color)' }}>
                    System Audit
                </h2>
            </div>

            <nav className="nav-menu">
                {menuItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => setView(item.id)}
                    >
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>


        </aside>
    );
};

export default Sidebar;
