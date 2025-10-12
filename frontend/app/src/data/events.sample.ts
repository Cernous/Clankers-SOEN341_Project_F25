// src/data/events.sample.ts

export type SimpleEvent = {
  id: string
  title: string
  date: string
  org: string
  where: string
}

export const sampleEvents: SimpleEvent[] = [
  { id: "welcome-week-bash", title: "Welcome Week Bash", date: "Sep 6", org: "Student Union", where: "Campus Quad" },
  { id: "movie-on-the-lawn", title: "Movie on the Lawn", date: "Sep 9", org: "Film Society", where: "North Lawn" },
  { id: "robotics-workshop", title: "Robotics Workshop", date: "Oct 2", org: "Coding Club", where: "Engineering Hall 201" },
  { id: "jazz-night-live", title: "Jazz Night Live", date: "Oct 13", org: "Music Department", where: "Arts Center" },
  { id: "art-coffee", title: "Art & Coffee", date: "Oct 21", org: "Fine Arts Club", where: "Gallery A" },
  { id: "community-5k", title: "Community 5K Run", date: "Nov 3", org: "Recreation Center", where: "Athletics Track" },
]
