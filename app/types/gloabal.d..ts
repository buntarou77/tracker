interface Payload{
    login: string | null,
    id: string | null
}
interface VerifyJwtResult{
    error: string,
    ok: boolean
    payload: Payload
}
interface transaction {
    userId: string,
    bankId: string,
    _id: string,
    amount: number,
    currency: string,
    category: string,
    date: Date,
    createdAt: Date,
    type: 'loss' | 'gain',
    balanceStatus: number
}