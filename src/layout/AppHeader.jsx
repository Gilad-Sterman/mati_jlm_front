import { useSelector } from 'react-redux';
import { LangSelect } from "../cmps/common/LangSelect";
import { selectIsAuthenticated } from '../store/authSlice';
import socketService from '../services/socketService';
    
export function AppHeader() {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const socketStatus = socketService.getStatus();
    
    return (
        <header className="app-header">
            <div className="header-left">
                <h1>מט"י ירושלים</h1>
                <h3>מרכז טיפוח יזמות</h3>
            </div>
            <div className="header-right">
                {isAuthenticated && (
                    <div style={{ 
                        fontSize: '12px', 
                        color: socketStatus.isConnected ? '#10b981' : '#6b7280',
                        marginRight: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}>
                        {socketStatus.isConnected ? '🟢' : '🔴'} 
                        Real-time
                    </div>
                )}
                <LangSelect />
            </div>
        </header>
    )
}   