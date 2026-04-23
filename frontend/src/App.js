import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Readers from './pages/Readers/Readers';
import ReaderDetail from './pages/Readers/ReaderDetail';
import Books from './pages/Books/Books';
import BookDetail from './pages/Books/BookDetail';
import BookForm from './pages/Books/BookForm';
import Borrowing from './pages/Borrowing/Borrowing';
import BorrowTransaction from './pages/Borrowing/BorrowTransaction';
import Returns from './pages/Returns/Returns';
import DueAlerts from './pages/Alerts/DueAlerts';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuthStore();
    return isAuthenticated ? children : <Navigate to='/login' />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                    <Route path='/login' element={<Login />} />
                </Route>

                {/* Protected Routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path='/' element={<Dashboard />} />
                    <Route path='/dashboard' element={<Dashboard />} />
                    <Route path='/readers' element={<Readers />} />
                    <Route path='/readers/:id' element={<ReaderDetail />} />
                    <Route path='/books' element={<Books />} />
                    <Route path='/books/new' element={<BookForm />} />
                    <Route path='/books/:id' element={<BookDetail />} />
                    <Route path='/books/:id/edit' element={<BookForm />} />
                    <Route path='/borrowing' element={<Borrowing />} />
                    <Route
                        path='/borrowing/new'
                        element={<BorrowTransaction />}
                    />
                    <Route path='/returns' element={<Returns />} />
                    <Route path='/due-alerts' element={<DueAlerts />} />
                    <Route path='/reports' element={<Reports />} />
                    <Route path='/settings' element={<Settings />} />
                </Route>

                {/* Redirect to login by default */}
                <Route path='*' element={<Navigate to='/login' />} />
            </Routes>
        </Router>
    );
}

export default App;
