/**
 * 共享类型定义
 */

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'user' | 'guest'

/**
 * 用户信息
 */
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: Date
}

/**
 * API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
