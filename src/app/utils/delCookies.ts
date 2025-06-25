import Cookies from "js-cookie";
function deleteCookiesStartingWith(prefix) {
    const allCookies = Cookies.get(); 

    Object.keys(allCookies).forEach(cookieName => {
        if (cookieName.startsWith(prefix)) {
            Cookies.remove(cookieName); 
        }
    });
}
export default deleteCookiesStartingWith;