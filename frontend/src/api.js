const BASE_URL = 'http://localhost:5000'

export const getTasks = async () => {
  const res = await fetch(`${BASE_URL}/tasks`)
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export const createTask = async (taskData) => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export const updateTask = async (id, taskData) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export const deleteTask = async (id) => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete task')
  return res.json()
}
