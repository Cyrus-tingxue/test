import { createContext, useState } from 'react';
import { fetchApi } from '../utils/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('office_auth_token'));
    const [username, setUsername] = useState(localStorage.getItem('office_auth_username'));

    const login = async (u, p) => {
        const data = await fetchApi('/api/auth/login', {
            method: 'POST',
            body: { username: u, password: p }
        });
        setAuthToken(data.access_token);
        setUsername(u);
        localStorage.setItem('office_auth_token', data.access_token);
        localStorage.setItem('office_auth_username', u);
    };

    const register = async (u, p) => {
        const data = await fetchApi('/api/auth/register', {
            method: 'POST',
            body: { username: u, password: p }
        });
        setAuthToken(data.access_token);
        setUsername(u);
        localStorage.setItem('office_auth_token', data.access_token);
        localStorage.setItem('office_auth_username', u);
    };

    const logout = () => {
        setAuthToken(null);
        setUsername(null);
        localStorage.removeItem('office_auth_token');
        localStorage.removeItem('office_auth_username');
    };

    return (
        <AuthContext.Provider value={{ authToken, username, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
