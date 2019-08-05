const jwt = require('jsonwebtoken')
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

  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET)

    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      ...body,
      user: user._id
    })

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

    const updatedBLog = await Blog.findByIdAndUpdate(req.params.id, blog, { new: true })
    const updatedBLogWithUserData = await Blog
      .findOne({ _id: updatedBLog._id })
      .populate('user', { username: 1, name: 1 })
    res.json(updatedBLogWithUserData.toJSON())

  } catch(exception) {
    next(exception)
  }
})

blogsRouter.delete('/:id', async (req, res, next) => {

  try {
    const decodedToken = jwt.verify(req.token, process.env.SECRET)
    const blog = await Blog.findById(req.params.id)

    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    if (decodedToken.id.toString() === blog.user.toString()) {
      await Blog.findByIdAndRemove(blog.id)
      res.status(204).end()
    } else {
      res.status(401).json({ error: 'only user who created the blog can delete it' })
    }
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.post('/:id/comments', async (req, res, next) => {
  const body = req.body

  try {
    const blog = await Blog.findById(req.params.id)
    blog.comments = blog.comments.concat(body.comment)
    const savedBlog = await blog.save()
    const blogAndUserData = await Blog
      .findOne({ _id: savedBlog._id })
      .populate('user', { username: 1, name: 1 })

    res.json(blogAndUserData.toJSON())

  } catch(exception) {
    next(exception)
  }
})

module.exports = blogsRouter