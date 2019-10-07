const { GraphQLServer } = require('graphql-yoga')
const { join } = require('path')
const { makeSchema, objectType, idArg, stringArg } = require('nexus')
const { Photon } = require('@generated/photon')
const { nexusPrismaPlugin } = require('@generated/nexus-prisma')

const photon = new Photon()

const nexusPrisma = nexusPrismaPlugin({
  photon: ctx => ctx.photon,
})

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

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.crud.jokes()
    t.list.field('filterJokesByAuthor', {
      type: 'Joke',
      args: {
        name: stringArg(),
      },
      resolve: async (_, { name }, ctx) => {
        const jokesByAuthor = await ctx.photon.authors.findMany({
          where: {
            name,
          },
          select: {
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
        console.log(JSON.stringify(jokesByAuthor))
        return jokesByAuthor
      },
    })
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.crud.createOneJoke({ alias: 'createJoke' })
    t.crud.deleteOneJoke({ alias: 'deleteJoke' })
  },
})

const schema = makeSchema({
  types: [Query, Mutation, Joke, Author, nexusPrisma],
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
