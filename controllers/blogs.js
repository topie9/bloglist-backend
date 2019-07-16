const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (req, res, next) => {
  try {
    const blogs = await Blog
      .find({})
      .populate('user', { username: 1, name: 1 })

    res.json(blogs.map(blog => blog.toJSON()))
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.post('/', async (req, res, next) => {
  const body = req.body

  const user = await User.findOne()

  const blog = new Blog({
    ...body,
    user: user._id
  })
  console.log(blog)
  try {
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    res.json(savedBlog.toJSON())
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.put('/:id', async (req, res, next) => {
  try {
    const blog = req.body

    const updatedBLog = await Blog.findByIdAndUpdate(blog.id, blog, { new: true })
    res.json(updatedBLog.toJSON())

  } catch(exception) {
    next(exception)
  }
})

blogsRouter.delete('/:id', async (req, res, next) => {
  try {
    await Blog.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch(exception) {
    next(exception)
  }
})

module.exports = blogsRouter