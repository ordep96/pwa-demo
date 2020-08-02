// Register service worker

if ( 'serviceWorker' in navigator ) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then( registration => {
        console.log(registration)
        console.log('Service Worker registered', registration.scope)
      })
      .catch(err => console.log('Service Worker failed', err))
  })
}

// notificaciones
if ( window.Notification && Notification.permission != 'denied' ) {
  Notification.requestPermission(status => {
    let notification = new Notification('titulo', {
      body: 'Soy una notificación',
      icon: './img/icon_192x192.png'
    })
  })
}


// Detectar conexion
let header = document.querySelector('.header')
let metaTagTheme =document.querySelector('meta[name=theme-color]')

const networkStatus = (e) => {
  if ( e.type === 'online' ) {
    metaTagTheme.setAttribute('content', '#0094BA')
    header.classList.remove('box-offline')
    Notification.requestPermission(status => {
      let notification = new Notification(':)', {
        body: 'conexión restablecida',
        icon: './img/icon_192x192.png'
      })
    })
    //registerBGSync()
  } else {
    metaTagTheme.setAttribute('content', '#777586')
    header.classList.add('box-offline')
    let notification = new Notification('Sin conexión :(', {
      body: 'Te has quedado sin conexión',
      icon: './img/icon_192x192.png'
    })
  }
}

document.addEventListener('DOMContentLoaded', e => {
  window.addEventListener('online', networkStatus)
  window.addEventListener('offline', networkStatus)
})

// Sincronizacion de fondo
if ( 'serviceWorker' in navigator && 'SyncManager' in window ) {

  function registerBGSync () {
    navigator.serviceWorker.ready
      .then(registration => {
        return registration.sync.register('github')
            .then(() => console.log('Background Sync registered'))
            .catch(err => console.log('Background Sync failed', err))
      })
  }

  registerBGSync()

}

// APi de github
let userInfo = document.querySelector('.js-github-user')
let searchForm = document.querySelector('.js-github-user-form')

function fetchGithubUser (user,requestFromBGSync) {
  let name = user || 'ordep96'
  let url = `https://api.github.com/users/${name}`

  fetch(url, {method: 'GET'})
    .then(res => res.json())
    .then(user => {
      if ( !requestFromBGSync ) {
        localStorage.removeItem('github')
      }

      let template = `
      <article class="user">
        <img class="user__image" src="${user.avatar_url}" alt="${user.login}"/>
        <h2 class="user__name">${user.name} (${user.login}) </h2>
        ${ user.bio != null ? (
          `<p class="user__description">${user.bio}</p>`
        ): ''}
        <p class="user__address"><b>Ubicación:</b> ${user.location}</p>
        <ul class="user__items">
          <li><span>Seguidores:</span> ${user.followers}</li>
          <li><span>Siguiendo:</span> ${user.following}</li>
        </ul>
        <a class="user__button" href="${user.html_url}" target="_blank">go to github</a>
      </article>`

      userInfo.innerHTML = template
      Notification.requestPermission(status => {
        let notification = new Notification('Github', {
          body: 'Data obtenida exitosamente',
          icon: './img/icon_192x192.png'
        })
      })
    })
    .catch(err => {
      localStorage.setItem('github', name)
      console.log(err)
    })
}


fetchGithubUser(localStorage.getItem('github'))

searchForm.addEventListener('submit', e => {
  e.preventDefault()
  let form = new FormData(e.target);
  let user = form.get('search')
  
  localStorage.setItem('github', user)
  fetchGithubUser(user)

  e.target.reset()
})

navigator.serviceWorker.addEventListener('message', e => {
  console.log('From background sync', e.data)
  fetchGithubUser(localStorage.getItem('github'), true)
})
