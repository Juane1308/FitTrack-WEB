// Tipografía de las pantallas rediseñadas (Perfil, Progreso). Se carga solo cuando una de ellas
// se abre, para no cambiar el resto de módulos.
const DISPLAY_FONT_URL = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&display=swap'

export function ensureDisplayFont() {
  if (document.querySelector(`link[href="${DISPLAY_FONT_URL}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = DISPLAY_FONT_URL
  document.head.append(link)
}
