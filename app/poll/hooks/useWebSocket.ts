import { useEffect, useRef, useState } from 'react'

export interface Message {
    text: string
    timestamp: string
}

export const useWebSocket = (url: string) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const socketRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        const socket = new WebSocket(url)
        socketRef.current = socket

        socket.onopen = () => {
            console.log('WebSocket connected')
            setIsConnected(true)
        }

        socket.onmessage = event => {
            const data: Message = JSON.parse(event.data)
            setMessages(prev => [...prev, data])
        }

        socket.onclose = () => {
            console.warn('WebSocket closed')
            setIsConnected(false)
        }

        socket.onerror = (err) => {
            console.error('WebSocket error', err)
        }

        return () => {
            socket.close()
        }
    }, [url])

    const sendMessage = (text: string) => {
        console.log(socketRef.current?.readyState, "WebSocket.OPEN")
        console.log(WebSocket.OPEN, "WebSocket.OPEN")
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(text)
        } else {
            console.warn('WebSocket not ready to send. Attempting to reconnect...')
            if (socketRef.current?.readyState === WebSocket.CLOSED || socketRef.current?.readyState === WebSocket.CLOSING) {
                const socket = new WebSocket(url)
                socketRef.current = socket

                socket.onopen = () => {
                    console.log('WebSocket reconnected')
                    setIsConnected(true)
                    socket.send(text)

                    console.log('Message sent after reconnection:', text)
                }

                socket.onmessage = event => {
                    const data: Message = JSON.parse(event.data)
                    setMessages(prev => [...prev, data])
                }

                socket.onclose = () => {
                    console.warn('WebSocket closed')
                    setIsConnected(false)
                }

                socket.onerror = (err) => {
                    console.error('WebSocket error', err)
                }
            }
        }
    }

    return { messages, sendMessage, isConnected }
}
