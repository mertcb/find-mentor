const { log } = require('console')
const fs = require('fs')
const got = require('got')
const spreadsheetId = '1x_W7Z2o_TGmEjL5cLTFbjO1R3KzQOqIhQKu9RQ4a_P4'
const apiKey = 'AIzaSyA5el9Fo8rMSYkcMjUqLfJi4tDB5_n0bzY'
const slugify = require('slugify')

const slugger = text =>
  slugify(text, {
    replacement: '-',
    lower: true,
    locale: 'tr'
  })

const mapper = (posts) => {
  const keys = posts.slice(0, 1)[0]
  return posts.slice(1).map((row) => {
    const rowData = {}
    keys.map((key, index) => {
      key = key.toLowerCase().replace(/\W/g, '_')
      rowData[key] = row[index]
    })
    return rowData
  })
}

const generateSlug = (posts) => {
  return posts.map((post) => {
    post.slug = slugger(post.name)
    return post
  })
}

async function getData () {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?key=${apiKey}&fields=valueRanges(range,values)&ranges=Mentees&ranges=Mentors`
    let response = await got(url)
    response = JSON.parse(response.body)
    let [mentees, mentors] = response.valueRanges
    mentees = mapper(mentees.values.slice(4).filter(r => r.length))
    mentors = mapper(mentors.values.filter(r => r.length))
    const data = { mentees, mentors }
    return { status: 200, data }
  } catch (err) {
    console.log(err)
    return { status: 404 }
  }
}

getData().then(({ status, data: { mentees, mentors } }) => {
  if (status !== 200) {
    throw new Error('Error when fetching data from spreadsheet')
  }
  fs.writeFileSync('content/mentees.json', JSON.stringify(generateSlug(mentees), null, 2))
  fs.writeFileSync('content/mentors.json', JSON.stringify(generateSlug(mentors), null, 2))
})
