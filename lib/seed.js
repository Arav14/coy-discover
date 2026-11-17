// Mock profiles for the Discover feed.
// `likedMe: true` marks seeded profiles that have already liked the logged-in
// user, so matches can happen during a demo. This flag is PRIVATE: it is turned
// into rows in `inboundLikes` and never sent to the client.

const raw = [
  ["Aanya", 21, "f", "Delhi University", "Chai over coffee, always. Will judge you by your playlist.", ["Indie music", "Chai", "Poetry"], true],
  ["Rohan", 22, "m", "IIT Delhi", "Building side projects at 2am. Looking for someone to ship with.", ["Coding", "Startups", "Football"], false],
  ["Ishita", 23, "f", "Gurugram", "Product designer. I notice fonts on restaurant menus.", ["Design", "Food walks", "Pottery"], true],
  ["Kabir", 24, "m", "Noida", "Gym at 6, standup comedy at 9. Balance.", ["Fitness", "Comedy", "Travel"], false],
  ["Meera", 20, "f", "Ashoka University", "Debate team captain. I'll argue either side, for fun.", ["Debate", "Books", "Hiking"], false],
  ["Arjun", 22, "m", "DTU", "Guitarist in a band nobody has heard of (yet).", ["Guitar", "Gigs", "Cricket"], true],
  ["Sanya", 21, "f", "Amity Noida", "Dog person. Sunset chaser. Bad at replying, good at calls.", ["Dogs", "Photography", "Cafes"], false],
  ["Vihaan", 23, "m", "Delhi", "Quizzer, history nerd, makes a great dal makhani.", ["Quizzing", "History", "Cooking"], false],
  ["Tara", 22, "f", "LSR, Delhi", "Theatre kid who never grew out of it.", ["Theatre", "Dance", "Thrifting"], true],
  ["Aditya", 25, "m", "Gurugram", "Consultant by day, amateur astronomer by night.", ["Astronomy", "Running", "Podcasts"], false],
  ["Navya", 21, "f", "NSUT", "Hackathon regular. Ask me about my failed startup ideas.", ["Hackathons", "Anime", "Badminton"], false],
  ["Dev", 22, "m", "JIMS Greater Noida", "Weekend trekker. Has opinions about Maggi.", ["Trekking", "Gaming", "Music"], true],
  ["Kiara", 23, "f", "South Delhi", "Bookstore hopper. Currently reading three books at once.", ["Books", "Art", "Yoga"], false],
  ["Reyansh", 24, "m", "Noida", "Bassist. Dog dad. Slow mornings.", ["Music", "Dogs", "Coffee"], false],
  ["Myra", 20, "f", "Miranda House", "Economics student who cries at Pixar films.", ["Movies", "Economics", "Baking"], false],
  ["Ayaan", 21, "m", "Bennett University", "F1 fan. Will explain DRS whether you ask or not.", ["F1", "Cars", "Football"], true],
  ["Diya", 22, "f", "Faridabad", "Kathak dancer and spreadsheet enthusiast.", ["Dance", "Finance", "Travel"], false],
  ["Ishaan", 23, "m", "IIIT Delhi", "ML engineer. Plants > people (negotiable).", ["ML", "Plants", "Chess"], false],
  ["Anika", 21, "f", "Jamia Millia", "Street food critic with a strong golgappa ranking.", ["Street food", "Vlogging", "Music"], false],
  ["Krish", 22, "m", "Shiv Nadar University", "Ultimate frisbee and Sunday cooking.", ["Frisbee", "Cooking", "Cycling"], false],
  ["Saanvi", 23, "f", "Gurugram", "Marketing at a D2C brand. Karaoke queen.", ["Karaoke", "Brands", "Travel"], true],
  ["Aarav", 24, "m", "Delhi", "Photographer. I'll make you look good, promise.", ["Photography", "Film", "Hiking"], false],
  ["Riya", 20, "f", "Sharda University", "Learning Korean for no particular reason.", ["K-dramas", "Languages", "Sketching"], false],
  ["Yash", 22, "m", "Galgotias University", "Calisthenics, chess, and cold coffee.", ["Chess", "Fitness", "Coffee"], false],
  ["Pari", 21, "f", "Hansraj College", "Writes short stories, mostly about cats.", ["Writing", "Cats", "Indie films"], false],
  ["Shaurya", 23, "m", "Noida", "Backend dev. My love language is clean APIs.", ["Coding", "Basketball", "Sci-fi"], true],
  ["Avni", 22, "f", "Delhi", "Climate volunteer. Thrift-store regular.", ["Sustainability", "Thrifting", "Hiking"], false],
  ["Rudra", 21, "m", "NIT Kurukshetra", "Drummer. Loud in band, quiet in person.", ["Drums", "Gaming", "Travel"], false],
  ["Zoya", 24, "f", "Gurugram", "Lawyer who reads fantasy novels on the metro.", ["Fantasy", "Law", "Swimming"], false],
  ["Vivaan", 22, "m", "Amity Noida", "Aspiring chef. Will feed you, guaranteed.", ["Cooking", "Food walks", "Football"], false],
  ["Nysa", 21, "f", "Jesus and Mary College", "Painter, plant mom, and part-time astrologer.", ["Painting", "Plants", "Astrology"], false],
  ["Atharv", 23, "m", "Greater Noida", "Cyclist. Sunrise rides to India Gate.", ["Cycling", "Photography", "Chai"], false],
];

// Photo indices are fixed so the same person always gets the same face.
export function buildSeed() {
  let f = 10, m = 10;
  const profiles = raw.map(([name, age, g, place, bio, interests], i) => ({
    id: `p${String(i + 1).padStart(2, "0")}`,
    name,
    age,
    location: place,
    bio,
    interests,
    photo: `https://randomuser.me/api/portraits/${g === "f" ? "women" : "men"}/${g === "f" ? f++ : m++}.jpg`,
  }));
  const inboundLikes = raw
    .map((r, i) => (r[6] ? { from: profiles[i].id, to: "me", at: "2026-11-01T00:00:00.000Z" } : null))
    .filter(Boolean);

  return {
    user: { id: "me", name: "You" },
    profiles,
    inboundLikes, // private: likes other people have sent the current user
    swipes: [],   // { userId, profileId, action: "like"|"pass", at }
    matches: [],  // { userId, profileId, at }
  };
}
