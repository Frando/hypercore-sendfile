const hypercoreIndexedFile = require('hypercore-indexed-file')
const replicator = require('@hyperswarm/replicator')
const hypercore = require('hypercore')
const ram = require('random-access-memory')
const fs = require('fs')

const op = process.argv[2]
const path = process.argv[3]
const key = process.argv[4]

if (op === 'send') {
  console.error('share ' + path)
  if (path === '-') {
    const feed = hypercore(ram)
    feed.ready(() => {
      process.stdin.pipe(feed.createWriteStream())
      onfeed(null, feed)
    })
  } else {
    const feed = hypercoreIndexedFile(path, err => onfeed(err, feed))
  }

  function onfeed (err, feed) {
    if (err) return console.error(err)
    const swarm = replicator(feed)
    console.error('replicating ' + feed.key.toString('hex'))
    feed.on('peer-add', peer => {
      console.error('new peer, starting sync')
    })
    feed.on('peer-remove', peer => {
      console.error('peer removed')
    })
  }
} else if (op === 'recv') {
  console.error(`write ${key} into ${path}`)
  const feed = hypercore(ram, key)
  const swarm = replicator(feed)
  feed.on('peer-add', peer => {
    console.error('new peer, starting sync')
  })
  let target
  if (path === '-') target = process.stdout
  else target = fs.createWriteStream(path)

  feed.createReadStream({ live: true }).pipe(target)
  feed.on('sync', () => {
    console.error('synced')
  })
} else {
  console.error(`usage: hypercore-sendfile recv|send PATH [KEY]`)
}
