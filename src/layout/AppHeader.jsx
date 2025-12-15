import { useSelector } from 'react-redux';
import { LangSelect } from "../cmps/common/LangSelect";
import { selectIsAuthenticated } from '../store/authSlice';
import socketService from '../services/socketService';
import logo1 from '../../src/assets/logo1.png';
    
export function AppHeader() {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const socketStatus = socketService.getStatus();
    
    return (
        <header className="app-header">
            <div className="header-left">
                <img className='logo' src={logo1} alt="" />
            </div>
            <div className="header-right">
                <LangSelect />
            </div>
        </header>
    )
}   