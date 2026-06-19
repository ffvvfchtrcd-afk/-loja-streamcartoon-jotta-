'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart_items')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setCart(parsed)
      }
    } catch {}
    setLoaded(true)
  }, [])

  const saveCart = useCallback((newCart) => {
    setCart(newCart)
    localStorage.setItem('cart_items', JSON.stringify(newCart))
  }, [])

  const addItem = useCallback((productId, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId)
      let newCart
      if (existing) {
        newCart = prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: (item.quantity || 1) + quantity }
            : item
        )
      } else {
        newCart = [...prev, { productId, quantity }]
      }
      localStorage.setItem('cart_items', JSON.stringify(newCart))
      return newCart
    })
  }, [])

  const updateQuantity = useCallback((productId, delta) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(1, (item.quantity || 1) + delta)
          return { ...item, quantity: newQty }
        }
        return item
      })
      localStorage.setItem('cart_items', JSON.stringify(newCart))
      return newCart
    })
  }, [])

  const setItemQuantity = useCallback((productId, quantity) => {
    setCart(prev => {
      const newQty = Math.max(1, quantity)
      const newCart = prev.map(item =>
        item.productId === productId ? { ...item, quantity: newQty } : item
      )
      localStorage.setItem('cart_items', JSON.stringify(newCart))
      return newCart
    })
  }, [])

  const removeItem = useCallback((productId) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.productId !== productId)
      localStorage.setItem('cart_items', JSON.stringify(newCart))
      return newCart
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    localStorage.setItem('cart_items', JSON.stringify([]))
  }, [])

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)

  const getItemQuantity = useCallback((productId) => {
    const item = cart.find(i => i.productId === productId)
    return item ? item.quantity : 0
  }, [cart])

  return (
    <CartContext.Provider value={{
      cart,
      loaded,
      addItem,
      updateQuantity,
      setItemQuantity,
      removeItem,
      clearCart,
      totalItems,
      getItemQuantity,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}