'use client';

import { signOut } from 'next-auth/react';

export default function Dashboard() {
    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}