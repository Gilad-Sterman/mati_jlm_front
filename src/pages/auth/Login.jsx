import i18n from "../../i18n";
export function Login() {
    return (
        <section className="login" >
            <h1>{i18n.t('login.title')}</h1>
            <form>
                <input type="text" placeholder={i18n.t('login.username')} />
                <input type="password" placeholder={i18n.t('login.password')} />
                <button type="submit">{i18n.t('login.submit')}</button>
            </form>
        </section>
    )
}