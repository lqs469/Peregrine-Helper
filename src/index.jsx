import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './App.jsx'
import './style.css'

const domContainer = document.querySelector('#ROOT')
domContainer && ReactDOM.render(<App />, domContainer)

/**
 * Append Spalink in PR page
 */
document.body.onload = () => {
  const PRUrlTemplate =
    'https://msasg.visualstudio.com/ContentServices/_git/msnews-experiences/pullrequest'
  const currentURL = location.href

  if (currentURL.includes(PRUrlTemplate)) {
    const btn = document.body.querySelector('.preview-check-list a')

    if (!btn || !btn.href) {
      return
    }

    const url = btn.href
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.addEventListener('load', () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      const spalinkTarget = iframeDoc.body.querySelector('.bolt-header-title')

      if (spalinkTarget && spalinkTarget.innerText) {
        const spalink = /#([\d.]+).*/g.exec(spalinkTarget.innerText)[1]

        if (spalink) {
          const spalinkEl = document.createElement('div')
          spalinkEl.innerText = `Spalink: ${spalink}`
          spalinkEl.style.height = '60px'
          spalinkEl.style.display = 'flex'
          spalinkEl.style.alignItems = 'center'
          spalinkEl.style.paddingLeft = '25px'
          spalinkEl.style.fontSize = '20px'
          spalinkEl.style.borderTop = 'solid 1px rgb(59, 58, 57)'
          const tableCard = document.querySelector('.bolt-table-card')
          tableCard && tableCard.appendChild(spalinkEl)
        }
      }

      iframe.remove()
    })

    iframe.src = url
    document.body.appendChild(iframe)
  }
}
