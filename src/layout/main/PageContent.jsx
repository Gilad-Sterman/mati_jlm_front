export function PageContent({ children }) {
    return (
        <main className="page-content">
            <div className="page-body">
                {children}
            </div>
        </main>
    )
}