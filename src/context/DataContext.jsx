import { createContext, useContext } from 'react'

const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  return <DataContext.Provider value={{}}>{children}</DataContext.Provider>
}
