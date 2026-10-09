import { ref } from 'vue'
import { defineStore } from 'pinia'

const DISPLAY_MS = 4000

export const useSnackbarController = defineStore('snackbar', () => {
  const message = ref('')
  const visible = ref(false)
  let timer = null

  function show(text) {
    clearTimeout(timer)
    message.value = text
    visible.value = true
    timer = setTimeout(hide, DISPLAY_MS)
  }

  function hide() {
    clearTimeout(timer)
    visible.value = false
  }

  return { message, visible, show, hide }
})
