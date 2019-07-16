const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const Blog = require('../models/blog')

describe('when there is initially some blogs saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})

    for (let blog of helper.initialBlogs) {
      let blogObj = new Blog(blog)
      await blogObj.save()
    }
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const res = await api.get('/api/blogs')

    expect(res.body.length).toBe(helper.initialBlogs.length)
  })

  test('name of the field that identifies blogs is id', async () => {
    const res = await api.get('/api/blogs')

    // test if first blog in response has field 'id'
    expect(res.body[0].id).toBeDefined()
  // to test if all blogs have id set
  //expect(res.body.map(blog => blog.id)).toBeDefined()
  })

  describe('adding new blog to db', () => {
    test('a valid blog can be added', async () => {
      const newBlog = {
        title: 'Type wars',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
        likes: 2,
      }

      await api.post('/api/blogs').send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAtDb = await helper.blogsInDb()
      expect(blogsAtDb.length).toBe(helper.initialBlogs.length + 1)
      // toContainEqual does not work, below returns array instead of found object
      //expect(blogsAtDb).toContainEqual(newBlog)

      // workaround to above merge fields to single string and match
      const blogs = blogsAtDb.map(n => (n.author+n.title+n.url+n.likes))
      expect(blogs).toContain(newBlog.author+newBlog.title+newBlog.url+newBlog.likes)
    })

    test('when blog\'s likes is not set it will be set to 0', async () => {
      const newBlogNoLikes = {
        title: 'Type wars',
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      }

      await api.post('/api/blogs').send(newBlogNoLikes)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogNoLikes = await Blog.findOne({
        title: 'Type wars',
        author: 'Robert C. Martin',
      })
      expect(blogNoLikes.likes).toBe(0)
    })

    test('fails with status code 400 if data is invalid', async () => {
      const newBlogNoUrl = {
        title: 'Type wars',
        author: 'Robert C. Martin',
      }
      const newBlogNoTitle = {
        author: 'Robert C. Martin',
        url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      }

      await api.post('/api/blogs').send(newBlogNoUrl)
        .expect(400)

      await api.post('/api/blogs').send(newBlogNoTitle)
        .expect(400)

      const blogsAtDb = await helper.blogsInDb()
      expect(blogsAtDb.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('removing blog from db', () => {
    test('valid blog can be removed, returns code 204', async () => {
      const blogsAtDb = await helper.blogsInDb()
      const blogToDelete = blogsAtDb[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

      const blogsAfterRemove = await helper.blogsInDb()

      expect(blogsAfterRemove.length).toBe(helper.initialBlogs.length - 1)

      const titles = blogsAfterRemove.map(b => b.title)

      expect(titles).not.toContain(blogToDelete.title)
    })

    test('returns status code 204 if trying to remove nonexisting blog', async () => {
      const nonExistingBlogId = await helper.nonExistingBlogId()

      await api
        .delete(`/api/blogs/${nonExistingBlogId}`)
        .expect(204)

      const blogsAfterRemove = await helper.blogsInDb()
      expect(blogsAfterRemove.length).toBe(helper.initialBlogs.length)
    })
  })

  describe('updating attribute(s) of the blog in db', () => {
    test('number of likes can be changed', async () => {
      const blogsAtDb = await helper.blogsInDb()
      const updatedBlogLikes = {
        id: blogsAtDb[0].id,
        likes: 2
      }

      await api
        .put(`/api/blogs/${updatedBlogLikes.id}`).send(updatedBlogLikes)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const blogsAfterUpdate = await helper.blogsInDb()
      expect(blogsAtDb.length).toBe(blogsAfterUpdate.length)
    })
  })
})

afterAll(() => {
  mongoose.connection.close()
})