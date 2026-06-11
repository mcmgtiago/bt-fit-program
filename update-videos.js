// Lê video_links.txt, extrai os IDs e links, e atualiza os JSONs automaticamente
// Uso: node update-videos.js

const fs = require('fs')
const path = require('path')

const linksFile = fs.readFileSync('./video_links.txt', 'utf8')
const tiagoPath = './src/data/tiago.json'
const brendaPath = './src/data/brenda.json'

const tiago = JSON.parse(fs.readFileSync(tiagoPath, 'utf8'))
const brenda = JSON.parse(fs.readFileSync(brendaPath, 'utf8'))

// Parse links: formato "id | Nome - https://youtu.be/XXXXX"
const linkMap = {}
linksFile.split('\n').forEach(line => {
  const match = line.match(/^([\w-]+)\s*\|[^-]+-\s*(https?:\/\/\S+)/)
  if (match) {
    linkMap[match[1].trim()] = match[2].trim()
  }
})

let updated = 0

function patchData(data) {
  data.blocks.forEach(block => {
    Object.values(block.days).forEach(day => {
      day.exercises.forEach(ex => {
        if (linkMap[ex.id]) {
          ex.videoDemo = linkMap[ex.id]
          updated++
        }
      })
    })
  })
}

patchData(tiago)
patchData(brenda)

fs.writeFileSync(tiagoPath, JSON.stringify(tiago, null, 2), 'utf8')
fs.writeFileSync(brendaPath, JSON.stringify(brenda, null, 2), 'utf8')

console.log(`✅ ${updated} links atualizados nos JSONs!`)
if (Object.keys(linkMap).length === 0) {
  console.log('⚠️  Nenhum link encontrado no video_links.txt. Verifique o formato:')
  console.log('    t-b1-ua-lateral-raise | Elevação Lateral - https://youtu.be/XXXXX')
}
