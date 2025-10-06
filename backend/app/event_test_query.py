import sqlite3


#This function returns all saved events in the EVENTS table as a dictionary
def get_events_test():
    conn = sqlite3.connect("clankers.db")

    #Dictionary maker
    conn.row_factory = sqlite3.Row  
    c = conn.cursor()

    c.execute("SELECT * FROM events")
    rows = c.fetchall()

    #Format
    events = [dict(row) for row in rows]

    conn.close()

    return events

