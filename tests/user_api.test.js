const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)

const helper = require('./test_helper')
const User = require('../models/user')

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const user = new User({ username: 'root', password: 'newsec' })
    await user.save()
  })

  test('creation succeeds with a new username', async () => {
    const usersAtDb = await helper.usersInDb()

    const newUser = {
      username: 'ttest',
      name: 'test tester',
      password: 'newtestsec',
    }

    await api.post('/api/users').send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAfterPost = await helper.usersInDb()
    expect(usersAfterPost.length).toBe(usersAtDb.length + 1)

    const usernames = usersAfterPost.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with statuscode 400 and message if username is already taken', async () => {
    const usersAtDb = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'superuser',
      password: 'newsecsec'
    }

    const result = await api.post('/api/users').send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAfterPost = await helper.usersInDb()
    expect(usersAfterPost.length).toBe(usersAtDb.length)
  })

  test('creation fails with statuscode 400 and message if username or proper password is missing', async () => {
    const usersAtDb = await helper.usersInDb()

    const newUserNoUsername = {
      name: 'test',
      password: 'test3test3'
    }
    const newUserInvalidPassword = {
      username: 'testingpass',
      name: 'test2'
    }

    const noUsernameResult = await api.post('/api/users')
      .send(newUserNoUsername)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(noUsernameResult.body.error).toContain('`username` is required')

    const InvalidPasswordResult = await api.post('/api/users')
      .send(newUserInvalidPassword)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(InvalidPasswordResult.body.error).toContain('minimum length for password is 3 characters')

    const usersAfterPost = await helper.usersInDb()
    expect(usersAfterPost.length).toBe(usersAtDb.length)
  })


})

afterAll(() => {
  mongoose.connection.close()
})