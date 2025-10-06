import sqlite3
import event_test_query

#THIS TEST FILE IS FOR TESTING USE BY ANTHONY, USE EVENT_TEST_QUERY FOR TEST FUNCTIONS USABLE BY FASTAPI

events = event_test_query.get_events_test()

for each_event in events:
    print(each_event)
