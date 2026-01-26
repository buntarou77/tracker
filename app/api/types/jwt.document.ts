export interface Payload{
    login: string | null,
    id: string | null
}

export interface VerifyJwtResult{
    error: string,
    ok: boolean
    payload: Payload
}