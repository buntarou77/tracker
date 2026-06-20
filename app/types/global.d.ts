interface Payload{
    login: string | null,
    id: string | null
}
interface VerifyJwtResult{
    error: string,
    ok: boolean
    payload: Payload
}

