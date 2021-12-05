import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './App.jsx'
import './style.css'

const domContainer = document.querySelector('#ROOT')
domContainer && ReactDOM.render(<App />, domContainer)
