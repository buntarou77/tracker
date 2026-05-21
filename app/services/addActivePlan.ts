import Cookies from 'js-cookie';
import { authFetch } from './authFetch';

export const addActivePlan = async (id: number, state: boolean) => {
    const login = Cookies.get('info_token');
    try {
        const res = await authFetch(`/api/setPlanActive?id=${id}&login=${login}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to update plan');
        }
        return await res.json();
    } catch (e) {
        throw e;
    }
}

