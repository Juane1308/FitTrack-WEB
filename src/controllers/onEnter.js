import { onActivated, onMounted } from 'vue'

// MainShell guarda las vistas en <KeepAlive>: al volver a una pantalla no se monta de nuevo.
// Ejecuta callback al montarla y cada vez que se vuelve a mostrar.
export function onEnter(callback) {
  let firstActivation = true
  onMounted(callback)
  onActivated(() => {
    if (firstActivation) {
      firstActivation = false
      return
    }
    callback()
  })
}
