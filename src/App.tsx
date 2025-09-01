import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './index.css'
import Home from './routes/Home'
import Download from './routes/Download'
import Releases from './routes/Releases'
import Terms from './routes/Terms'
import Privacy from './routes/Privacy'
import Contributors from './routes/Contributors'
import { Logo } from './components/Logo'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-full flex-col">
        <header className="relative border-b border-slate-800/60 bg-slate-950" style={{ zIndex: 50 }}>
          <div className="container-app flex items-center justify-between py-4">
            <NavLink to="/" className="flex items-center gap-3">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-semibold tracking-tight text-white">U-Download</span>
            </NavLink>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <NavLink className={({isActive})=>isActive? 'text-indigo-600 font-semibold' : 'text-slate-300 hover:text-indigo-400 font-medium'} to="/download">Download</NavLink>
              <NavLink className={({isActive})=>isActive? 'text-indigo-600 font-semibold' : 'text-slate-300 hover:text-indigo-400 font-medium'} to="/releases">Releases</NavLink>
              <NavLink className={({isActive})=>isActive? 'text-indigo-600 font-semibold' : 'text-slate-300 hover:text-indigo-400 font-medium'} to="/contributors">Contributors</NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/download" element={<Download />} />
            <Route path="/releases" element={<Releases />} />
            <Route path="/contributors" element={<Contributors />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </main>
        <footer className="relative border-t border-slate-800/60 bg-slate-950" style={{ zIndex: 50 }}>
          <div className="container-app py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-slate-400 font-medium">
                © <span>{new Date().getFullYear()}</span> U-Download
              </div>
              <div className="flex gap-6 text-sm">
                <NavLink 
                  to="/terms" 
                  className="text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Terms & Conditions
                </NavLink>
                <NavLink 
                  to="/privacy" 
                  className="text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Privacy Policy
                </NavLink>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}
