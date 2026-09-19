import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({ baseURL })

export const getApiHealth = async () => {
  const { data } = await api.get('/health')
  return data
}
