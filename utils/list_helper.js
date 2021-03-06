const _ = require('lodash')

const dummy = (blogs) => { // eslint-disable-line
  return 1
}

const totalLikes = (blogs) => {
  return blogs.length === 0
    ? 0
    : blogs.reduce((acc, cur) => acc + cur.likes, 0)
}

// return first blog found with most likes
const favoriteBlog = (blogs) => {
  if(blogs.length === 0)
    return null

  let fav = blogs[0]
  blogs.forEach((blog) => {
    fav = blog.likes > fav.likes ? blog : fav
  })
  return fav
}

const mostBlogs = (blogs) => {
  if(blogs.length === 0)
    return null

  const blogCountByAuthor= _.map(
    _.countBy(blogs, 'author'), (blogs, author) => ({ blogs, author })
  )

  return _.maxBy(blogCountByAuthor, 'blogs')
}

const mostLikes = (blogs) => {
  if(blogs.length === 0)
    return null

  const bloggersGrouped = _.groupBy(blogs, 'author')
  const authorList = []
  _.forEach(bloggersGrouped, (blogger) => {
    authorList.push(
      {
        author: _.head(blogger).author,
        likes: _.sumBy(blogger, (blog) => (blog.likes))
      }
    )
  })

  return _.maxBy(authorList, 'likes')
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}