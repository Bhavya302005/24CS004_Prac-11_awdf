require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const Task = require('./models/Task')

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager'
const HOST_MONGO_URI = process.env.HOST_MONGO_URI || 'mongodb://host.docker.internal:27017/taskmanager'

app.use(cors())
app.use(express.json())

// Primary connection (Docker MongoDB container)
mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`Connected to primary MongoDB [db: ${mongoose.connection.name || 'taskmanager'}] at ${MONGO_URI}`))
  .catch((err) => console.error('Primary MongoDB connection error:', err.message))

// Secondary dual-sync connection to host Windows MongoDB (so MongoDB Compass reflects live)
let hostConn = null
let hostTasks = null

if (MONGO_URI.includes('mongodb:27017')) {
  mongoose.createConnection(HOST_MONGO_URI).asPromise()
    .then(conn => {
      hostConn = conn
      hostTasks = conn.collection('tasks')
      console.log('Dual-sync connected to host Windows MongoDB for Compass')
    })
    .catch(() => {
      // Host mongo not available or running outside Docker, perfectly fine
    })
}

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Task Management Backend API is running inside Docker container',
    database: mongoose.connection.name || 'taskmanager',
    mongoUri: MONGO_URI,
    mongoConnected: mongoose.connection.readyState === 1,
    hostSyncActive: !!hostTasks
  })
})

app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 })
    res.status(200).json(tasks)
  } catch (err) {
    next(err)
  }
})

app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, priority } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const newTask = await Task.create({
      title: title.trim(),
      description: description || '',
      completed: false,
      priority: priority || 'medium'
    })

    if (hostTasks) {
      try {
        await hostTasks.insertOne({
          _id: newTask._id,
          title: newTask.title,
          description: newTask.description,
          completed: newTask.completed,
          priority: newTask.priority,
          createdAt: newTask.createdAt,
          __v: 0
        })
      } catch (e) {
        console.error('Host dual-sync insert warning:', e.message)
      }
    }

    res.status(201).json(newTask)
  } catch (err) {
    next(err)
  }
})

app.put('/tasks/:id', async (req, res, next) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Task not found' })

    if (hostTasks) {
      try {
        const { ObjectId } = require('mongodb')
        await hostTasks.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: req.body }
        )
      } catch (e) {
        console.error('Host dual-sync update warning:', e.message)
      }
    }

    res.status(200).json(updated)
  } catch (err) {
    next(err)
  }
})

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Task not found' })

    if (hostTasks) {
      try {
        const { ObjectId } = require('mongodb')
        await hostTasks.deleteOne({ _id: new ObjectId(req.params.id) })
      } catch (e) {
        console.error('Host dual-sync delete warning:', e.message)
      }
    }

    res.status(200).json({ message: 'Task deleted successfully' })
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`)
})
