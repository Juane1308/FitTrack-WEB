export class ChatContext {
  constructor({ section, selectedItem = null }) {
    this.section = section
    this.selectedItem = selectedItem
  }
}
