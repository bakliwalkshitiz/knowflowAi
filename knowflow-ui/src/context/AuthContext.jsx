import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('kf_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() =>
    localStorage.getItem('kf_token')
  )

  const login = (userData, jwtToken) => {
    setUser(userData)
    setToken(jwtToken)

    localStorage.setItem('kf_user', JSON.stringify(userData))
    localStorage.setItem('kf_token', jwtToken)
  }

  const updateUser = (updatedData) => {
    setUser(prev => {
      const next = { ...prev, ...updatedData }
      localStorage.setItem('kf_user', JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    const currentEmail = user?.email

    setUser(null)
    setToken(null)

    localStorage.removeItem('kf_user')
    localStorage.removeItem('kf_token')

    if (currentEmail) {
      localStorage.removeItem(`kf_sessions_${currentEmail}`)
    }
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)