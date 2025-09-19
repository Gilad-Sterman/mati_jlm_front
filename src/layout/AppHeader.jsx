import { LangSelect } from "../cmps/common/LangSelect";
    
export function AppHeader() {
    return (
        <header className="app-header">
            <div className="header-left">
                <h1>מט"י ירושלים</h1>
                <h3>מרכז טיפוח יזמות</h3>
            </div>
            <div className="header-right">
                <LangSelect />
            </div>
        </header>
    )
}   