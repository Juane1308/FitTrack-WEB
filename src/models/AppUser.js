export class AppUser {
  constructor({ id = null, name, email, goal = null, profileCompleted = false }) {
    this.id = id
    this.name = name
    this.email = email
    this.goal = goal
    this.profileCompleted = Boolean(profileCompleted)
  }
}
