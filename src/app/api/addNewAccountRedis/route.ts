import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'

export async function POST(request: NextRequest){
    const data = await request.json()
    const {name, notes = '', currency, balance, login} = data;
    const client = createClient({url: 'redis://127.0.0.1:6379'})
    try{
        await client.connect()
        console.log('ok1')
        const bankAccounts = await client.get(`bankAccounts_${login}`)
        console.log('ok2')
        const dataArr = await JSON.parse(bankAccounts.bankAccounts || bankAccounts)
        console.log(dataArr)
        const newAccounts = [...dataArr, {name, notes, currency, balance, login}]
        console.log('ok3')
        try{
            const res = await fetch(`http://localhost:3000/api/addNewAccount`, 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({name, notes, currency, balance, login})
            })
            if(res.ok){
                const result = await res.json()
                console.log('set')
                await client.set(`bankAccounts_${login}`, await JSON.stringify(newAccounts))
                await client.quit()
                return NextResponse.json({value: result}, {status: 201});
            }
        }catch(e){
            console.log('first_error')
            return NextResponse.json({error: e}, {status: 500});
        }

        return NextResponse.json({value: newAccounts}, {status: 201})
    }catch(e){
        await client.quit()
        try{
            const res = await fetch(`http://localhost:3000/api/addNewAccount`, 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({name, notes, currency, balance, login})
            })
            if(res.ok){
                const result = await res.json()
                return NextResponse.json({value: result}, {status: 201});
            }else{
                console.log('second_error')
                return NextResponse.json({value: res}, {status: 500});
            }
        }catch(e){
            console.log('last_error')
            return NextResponse.json({error: e}, {status: 500});
        }
    }
}