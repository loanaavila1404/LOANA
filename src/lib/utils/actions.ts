export type ActionState<T = unknown> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

export function success<T>(message: string, data?: T): ActionState<T> {
  return { success: true, message, data }
}

export function error(message: string, errors?: Record<string, string[]>): ActionState<unknown> {
  return { success: false, message, errors }
}
