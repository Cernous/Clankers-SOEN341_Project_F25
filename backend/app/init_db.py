import sqlite3

#Connect to our database
conn = sqlite3.connect('clankers.db')

#Create a cursor that goes through the tables
c = conn.cursor()

#EVENTS table creation
#NOTES
#TAGS will be a CSV value
#VISIBLE will be 'true' or 'false'
#PICTURES will be a csv of a low res encoding format

c.execute("""CREATE TABLE events (
          EV_NAME TEXT,
          EV_DESC TEXT,
          EV_PRICE REAL,
          EV_LOCATION TEXT,
          ORGANIZER_ID INTEGER,
          EV_ID INTEGER,
          TAGS TEXT,
          VISIBLE TEXT,
          STATE TEXT,
          COUNT_ATTENDEES INTEGER,
          DATE_CREATION TEXT,
          DATE_PUBLISHED TEXT,
          DATE_BEGIN TEXT,
          DATE_END TEXT,
          DATE_ARCHIVE TEXT,
          PICTURES TEXT
          )""")

#USERS table creation
#NOTES
#ROLE will be U for user, A for admin or O for organizer
#SAVED_EVENTS will be a CSV value
#TICKETS will be a CSV value

c.execute("""CREATE TABLE users (
          FIRST_NAME TEXT,
          LAST_NAME TEXT,
          PRONOUN TEXT,
          ROLE TEXT,
          EMAIL TEXT,
          USERNAME TEXT,
          PASSWORD TEXT,
          TOKEN TEXT,
          USER_ID INTEGER,
          DATE_OF_BIRTH TEXT,
          SAVED_EVENTS TEXT,
          TICKETS TEXT
          )""")

#REVIEWS table planned for sprint 3

#c.execute("""CREATE TABLE reviews (
#          USER_ID INTEGER
#          EV_ID INTEGER
#          RE_DESC
#          DATE_CREATION
#          RE_STAR
#          VISIBLE TEXT
#          )""")

#ATTENDEES table creation
#NOTES
#PRESENCE will be 'true' or 'false'

c.execute("""CREATE TABLE attendees (
          USER_ID INTEGER,
          EV_ID INTEGER,
          TICKET_QR TEXT,
          CHECK_IN TEXT,
          PRESENCE TEXT
          )""")

#PERMISSIONS table creation
#PERM will be a CSV for accesses

c.execute("""CREATE TABLE permissions(
          ROLE TEXT,
          PERM TEXT
          )""")

conn.commit()

conn.close()
