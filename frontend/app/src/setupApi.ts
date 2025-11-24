// src/setupApi.ts
import { OpenAPI } from './client'
import { getToken } from './lib/tokenStore'

OpenAPI.BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
OpenAPI.TOKEN = async () => getToken() ?? ''
