export const addActivePlan = async (id: number, state: boolean) => {
    const login = Cookies.get('info_token');
    try {
        const res = await fetch(`api/setPlanActive?id=${id}&login=${login}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Ошибка при обновлении плана');
        }
        return await res.json();
    } catch (e) {
        console.error('Ошибка при обновлении плана:', e);
        throw e;
    }
}

