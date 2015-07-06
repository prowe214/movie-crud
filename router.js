var routes = require('routes')()
var db = require('monk')('localhost/movies')
var movies = db.get('movies')
var view = require('./view')
var qs = require('qs')
var fs = require('fs')
var mime = require('mime')

routes.addRoute('/movies', (req, res, url) => {
  res.setHeader('Content-Type', 'text/html')
  if (req.method === 'GET') {
    movies.find({}, (err, docs) => {
      if (err) res.end('big 404')
      var template = view.render('movies/home', {movies: docs, pageTitle: 'Splash Page'})
      res.end(template)
    })
  }
})

routes.addRoute('/movies/index', (req, res, url) => {
  res.setHeader('Content-Type', 'text/html')
  if (req.method === 'GET') {
    movies.find({}, (err, docs) => {
      if (err) res.end('big 404')
      var template = view.render('movies/index', {movies: docs, pageTitle: 'List of Movies'})
      res.end(template)
    })
  }
  if (req.method === 'POST') {
    var data = ''

    req.on('data', (chunk) => {
      data += chunk
    })

    req.on('end', function () {
      var movie = qs.parse(data)
      movies.insert(movie, (err, doc) => {
        if (err) res.end('error inserting')
        res.writeHead(302, {'Location': '/movies'})
        res.end()
      })
    })
  }
})

routes.addRoute('/movies/new', (req, res, url) => {
  res.setHeader('Content-Type', 'text/html')
  if (req.method === 'GET') {
    fs.readFile('./templates/movies/new.html', (err, file) => {
      if (err) res.end('error loading new')
      res.end(file.toString())
    })
  }
})

routes.addRoute('/movies/:id/edit', (req, res, url) => {
  if (req.method === 'GET') {
    movies.findOne({_id: url.params.id}, (err, doc) => {
      var template = view.render('movies/edit', {movies: doc})
      if (err) res.end('error loading edit page')
      res.end(template)
    })
  }
  if (req.method === 'POST') {
    var body = ''
    req.on('data', (data) => {
      body += data
    })
    req.on('end', () => {
      body = qs.parse(body)
      movies.update({_id: url.params.id}, {title: body.title, director: body.director, year: body.year, rating: body.rating, posterurl: body.posterurl}, (err, doc) => {
        if (err) res.end('error updating')
        res.writeHead(302, {'Location': '/movies/index'})
        res.end()
      })
    })
  }
})

routes.addRoute('/movies/:id/delete', (req, res, url) => {
  if (req.method === 'POST') {
    movies.remove({_id: url.params.id}, (err, doc) => {
      if (err) res.end('error deleting')
      res.writeHead(302, {'Location': '/movies/index'})
      res.end()
    })
  }
})

routes.addRoute('/movies/:id', (req, res, url) => {
  res.setHeader('Content-Type', 'text/html')
  if (req.method === 'GET') {
    movies.findOne({_id: url.params.id}, (err, doc) => {
      if (err) res.end('error loading this document')
      var template = view.render('movies/show', doc)
      res.end(template)
    })
  }
})

routes.addRoute('/public/*', (req, res, url) => {
  res.setHeader('Content-Type', mime.lookup(req.url))
  fs.readFile('.' + req.url, (err, file) => {
    if (err) res.end('error in public')
    res.end(file)
  })
})

module.exports = routes
