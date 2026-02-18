import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale})=>{
    console.log('Current locale:', locale);
    
    const defaultLocale = 'en';
    const resolvedLocale = locale || defaultLocale;
    
    try {
        return {
            messages: (await import(`./../messages/${resolvedLocale}.json`)).default
        }
    } catch (error) {
        console.error(`Failed to load messages for locale: ${resolvedLocale}`, error);
        return {
            messages: (await import(`./../messages/${defaultLocale}.json`)).default
        }
    }
})