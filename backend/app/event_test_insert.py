import sqlite3

conn = sqlite3.connect("clankers.db")
c = conn.cursor()

#Test data
events_dummy = [
    ("Tech Expo", "Annual tech exhibition", 25.0, "Montreal", 1, 101, "tech,expo", "yes", "active", 0, "2025-10-01", "2025-10-05", "2025-11-01", "2025-11-03", None, "img1.jpg"),
    ("Art Fair", "Local artists showcase", 10.0, "Quebec City", 2, 102, "art,local", "yes", "active", 0, "2025-09-15", "2025-09-20", "2025-10-10", "2025-10-12", None, "img2.jpg"),
    ("Music Fest", "Outdoor music festival", 50.0, "Toronto", 3, 103, "music,festival", "no", "planned", 0, "2025-08-01", "2025-08-10", "2025-09-05", "2025-09-07", None, "img3.jpg")
]

# Insert multiple rows
c.executemany("""
INSERT INTO events (
    EV_NAME, EV_DESC, EV_PRICE, EV_LOCATION, ORGANIZER_ID, EV_ID, TAGS, VISIBLE, STATE,
    COUNT_ATTENDEES, DATE_CREATION, DATE_PUBLISHED, DATE_BEGIN, DATE_END, DATE_ARCHIVE, PICTURES
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", events_dummy)

print("Successfully added test data")

conn.commit()
conn.close()
