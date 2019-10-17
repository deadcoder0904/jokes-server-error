const { GraphQLServer } = require('graphql-yoga')
const { join } = require('path')
const {
  makeSchema,
  objectType,
  stringArg,
  queryType,
  mutationType,
} = require('nexus')
const { Photon } = require('@generated/photon')
const { nexusPrismaPlugin } = require('nexus-prisma')

const photon = new Photon()

const nexusPrisma = nexusPrismaPlugin()

const Joke = objectType({
  name: 'Joke',
  definition(t) {
    t.model.id()
    t.model.content()
    t.model.author()
  },
})

const Author = objectType({
  name: 'Author',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.jokes()
  },
})

const Query = queryType({
  definition(t) {
    t.crud.jokes()
    t.list.field('filterJokesByAuthor', {
      type: 'Author',
      args: {
        name: stringArg(),
      },
      resolve: async (_, { name }, ctx) => {
        const jokesByAuthor = await ctx.photon.authors.findMany({
          where: {
            name,
          },
          include: {
            jokes: true,
          },
        })
        // const jokesByAuthor = await ctx.photon.jokes.findMany({
        //   where: {
        //     author: {
        //       name,
        //     },
        //   },
        // })
        console.log(JSON.stringify(jokesByAuthor, null, 2))
        return jokesByAuthor
      },
    })
  },
})

const Mutation = mutationType({
  definition(t) {
    t.crud.createOneJoke({ alias: 'createJoke' })
    t.crud.deleteOneJoke({ alias: 'deleteJoke' })
  },
})

const schema = makeSchema({
  plugins: [nexusPrisma],
  types: [Query, Mutation, Joke, Author],
  outputs: {
    schema: join(__dirname, '/schema.graphql'),
  },
  typegenAutoConfig: {
    sources: [
      {
        source: '@generated/photon',
        alias: 'photon',
      },
    ],
  },
})

const server = new GraphQLServer({
  schema,
  context: request => {
    return {
      ...request,
      photon,
    }
  },
})

server.start(() =>
  console.log(
    `🚀 Server ready at: http://localhost:4000\n⭐️ See sample queries: http://pris.ly/e/js/graphql#6-using-the-graphql-api`,
  ),
)
module.exports = { Author, Joke }
