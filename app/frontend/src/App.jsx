import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "sonner"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
      <Sonner richColors position="top-center" />
    </>
  )
}

export default App 