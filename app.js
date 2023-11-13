const express = require('express')
const crypto = require('node:crypto')
const cors = require('cors')
const app = express()
const moviesJSON = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

app.use(express.json())
app.use(
  cors({
    // cabezera origin
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:8080',
        'http://localhost:1234',
        'http://movies.com'
      ]
      if (ACCEPTED_ORIGINS.includes(origin)) {
        // retorno que no hubo errores y que esta permitido
        return callback(null, true)
      }
      // Para nuestra propia pagina
      if (!origin) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    }
  })
)
app.disable('x-powered-by')

// ruta inicial
app.get('/', (req, res) => {
  res.json({ message: 'hola mundo' })
})
// ruta de movies
app.get('/movies', (req, res) => {
  // si hay una query en la url devuelvo esas peliculas q coinciden
  const { genre } = req.query // ?query=drama

  if (genre) {
    const filteredMovies = moviesJSON.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase === genre.toLowerCase)
    )
    return res.json(filteredMovies)
  }
  return res.json(moviesJSON)
})

app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = moviesJSON.find((movie) => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie Not Found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)
  if (result.error) {
    return res.status(400).json({ message: JSON.parse(result.error.message) })
  }
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4  universal unique id
    ...result.data
  }
  moviesJSON.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = moviesJSON.findIndex((movie) => movie.id === id)
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }
  moviesJSON.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (!result.success) {
    return res.status(400).json({ message: JSON.parse(result.error.message) })
  }
  const { id } = req.params
  const movieIndex = moviesJSON.findIndex((movie) => movie.id === id)
  if (movieIndex === -1) {
    return res.statusCode(404).json({ message: 'Movie not found' })
  }
  const updateMovie = {
    ...moviesJSON[movieIndex],
    ...result.data
  }
  moviesJSON[movieIndex] = updateMovie
  return res.json(updateMovie)
})

app.use((res, req) => {
  res.status(404).send('<h1>404</h1>')
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server is listening on port: http://localhost:${PORT}`)
})

// REST API Representational State Transfer
// es una arquitectura de software 2000 - Ray Fielding
// Crear a base de principios la idea de poder crear algo que
// pueda sostenerse en el tiempo la mejor forma posible y simplificar
// el desarrollo de esa pieza de software
