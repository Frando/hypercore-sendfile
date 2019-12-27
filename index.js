const hypercoreIndexedFile = require('hypercore-indexed-file')
const replicator = require('@hyperswarm/replicator')
const hypercore = require('hypercore')
const ram = require('random-access-memory')
const fs = require('fs')

const op = process.argv[2]
const path = process.argv[3]
const key = process.argv[4]

if (op === 'send') {
  console.log('share ' + path)
  const feed = hypercoreIndexedFile(path, (err) => {
    const swarm = replicator(feed)
    console.log('replicating ' + feed.key.toString('hex'))
    feed.on('peer-add', peer => {
      console.log('new peer, starting sync')
    })
    feed.on('peer-remove', peer => {
      console.log('peer removed')
    })
  })
} else if (op === 'recv') {
  console.log(`write ${key} into ${path}`)
  const feed = hypercore(ram, key)
  const swarm = replicator(feed)
  feed.on('peer-add', peer => {
    console.log('new peer, starting sync')
  })
  const target = fs.createWriteStream(path)
  feed.createReadStream({ live: true }).pipe(target)
  feed.on('sync', () => {
    console.log('synced')
  })
} else {
  console.log(`usage: hypercore-sendfile recv|send PATH [KEY]`)
}
