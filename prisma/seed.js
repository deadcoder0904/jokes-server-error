const { Photon } = require('@generated/photon')
const photon = new Photon()
const jokes = require('./jokes.json')

async function main() {
  for await (let joke of jokes) {
    const { content, author } = joke
    await photon.jokes.create({
      data: {
        author: {
          create: {
            name: author,
          },
        },
        content,
      },
    })
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await photon.disconnect()
  })
