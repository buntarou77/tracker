import { useState, useEffect } from "react"

const useDebounce = (value: any, delay: number) => {
    const [state, setState] = useState<any>()

    useEffect(() => {
        const debounce = setTimeout(()=>{
            setState(value)
        },delay)
        return () => clearTimeout(debounce)
    },[value])

    return state
}

export default useDebounce;

