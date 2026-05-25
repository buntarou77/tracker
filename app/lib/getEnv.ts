export default function getEnv(key: string){
    const data = process.env[key];
    if(!data){
        throw new Error(`missing env varieble: ${key}`)
    }
    return data
}