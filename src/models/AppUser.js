export class AppUser {
  constructor({ id = null, name, email, goal }) {
    this.id = id
    this.name = name
    this.email = email
    this.goal = goal
  }
}
