// Create button
const addToLibraryButton = document.createElement('a')
addToLibraryButton.classList.add('cta-btn', 'cta-btn--solid', 'cta-btn--red', 'active')
addToLibraryButton.setAttribute('aria-current', 'true')

addToLibraryButtonInside = document.createElement('div')
addToLibraryButtonInside.classList.add('innerFill')
addToLibraryButtonInside.innerText = 'Loading...'

addToLibraryButton.appendChild(addToLibraryButtonInside)

// Create log div
const logDiv = document.createElement('div')
logDiv.style.height = '200px'
logDiv.style.overflowY = 'auto'
logDiv.style.background = '#e62429'
logDiv.style.color = '#FFF'
logDiv.style.display = 'none'

// Display button and logDiv
const buttonParentNode = document.querySelector('.module .featured-item-info-wrap .featured-item-text')
if (buttonParentNode) {
  buttonParentNode.appendChild(addToLibraryButton)
  buttonParentNode.appendChild(logDiv)
}

// Extract serie ID from the url
const serieId = location.href.match('^.*series\/([0-9]*).*$')[1]
if (!serieId) {
  addToLibraryButtonInside.innerTExt = 'ERROR : Serie ID not found.'
  throw new Error('Serie ID not found')
}

let loggedIn = false
if (!sessionStorage.getItem('marvelUserData')) {
  addToLibraryButtonInside.innerText = 'ERROR : Session marvelUserData not found'
  throw new Error('Session marvelUserData not found.')
}

try {
  loggedIn = JSON.parse(sessionStorage.getItem('marvelUserData')).loggedIn
} catch (e) {
  addToLibraryButtonInside.innerText = 'ERROR : mavelUserData\'s parsing failed'
  throw new Error('mavelUserData\'s parsing failed')
}

if (!loggedIn) {
  addToLibraryButtonInside.innerText = 'You must be logged in.'
  throw new Error('User not logged in.')
}

let comicsNumber = 0
// Get number of comics in the series
let xhr = new XMLHttpRequest()
xhr.open('GET', 'https://www.marvel.com/comics/show_more?offset=0&tpl=..%2Fpartials%2Fcomic_issue%2Fcomics_singlerow_item.mtpl&byType=comic_series&limit=1&isDigital=1&byId=' + serieId)
xhr.onreadystatechange = function () {
  if (xhr.readyState === 4) {
    try {
      let responseJson = JSON.parse(xhr.responseText)
      if (responseJson.count) {
        comicsNumber = responseJson.count
        addToLibraryButtonInside.innerText = 'Add ' + comicsNumber + ' issue' + (comicsNumber > 0 ? 's' : '') + ' to Library'
        registerAddEvent()
      } else {
        addToLibraryButtonInside.innerText = 'No Marvel Unlimited comics in this series.'
      }
    } catch (e) {
      addToLibraryButtonInside.innerText = 'An error occured.'
      throw new Error('Failed parse JSON')
    }
  }
}
xhr.send()

const registerAddEvent = function () {
  addToLibraryButton.addEventListener('click', function (e) {
    e.preventDefault()
    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          let responseJson;
          try {
            responseJson = JSON.parse(xhr.responseText)
          } catch (e) {
            addToLibraryButtonInside.innerText = 'An error occured.'
            throw new Error('Failed parse JSON')
          }
          if (responseJson && responseJson.output) {
            addToLibrary(responseJson.output)
          }
        } else {
          addToLibraryButtonInside.innerText = 'An error occured.'
          throw new Error('Failed to get comic list')
        }
      }
    }
    xhr.open('GET', 'https://www.marvel.com/comics/show_more?offset=0&tpl=..%2Fpartials%2Fcomic_issue%2Fcomics_singlerow_item.mtpl&byType=comic_series&limit=' + comicsNumber + '&isDigital=1&byId=' + serieId, true)
    xhr.send()
  })
}

const addToLibrary = function(html) {
  const idRegex = /www\.marvel.com\/comics\/issue\/([0-9]*)/g
  const nameRegex = ''

  const mainDocument = document.createElement('div')
  mainDocument.innerHTML = html

  logDiv.innerHTML = ''
  logDiv.style.display = 'block'

  let comicIssues = mainDocument.getElementsByClassName('row-item-image')
  for (let i = 0; i < comicIssues.length; i++) {
    const comicLink = comicIssues[i].getElementsByTagName('a')[0]
    const comicImage = comicIssues[i].getElementsByTagName('img')[0]
    if (!comicLink) continue
    idRegexResult = idRegex.exec(comicLink.getAttribute('href'))
    if (!idRegexResult || !idRegexResult[1]) {
      continue
    }
    const comicId = idRegexResult[1]
    let comicTitle = (comicImage.getAttribute('title') || comicId).trim();

    let p = document.createElement('p')
    p.style.padding = '2px 5px'
    p.innerHTML = 'Adding <i>' + comicTitle + '</i>...'
    logDiv.appendChild(p)

    let xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 201) {
          p.innerHTML = '<i>' + comicTitle + '</i> added to library !'
        } else {
          p.innerHTML = '<i>' + comicTitle + '</i> error !!!'
        }
      }
    }
    xhr.open('POST', 'https://www.marvel.com/my_account/my_must_reads', true)

    let formData = new FormData()
    formData.append('id', comicId)
    xhr.send(formData)
  }
}
